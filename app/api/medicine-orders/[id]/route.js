import { NextResponse } from "next/server";
import { db } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";

/**
 * PUT /api/medicine-orders/[id] - Update order status
 */
export async function PUT(request, { params }) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id } = params;
    const body = await request.json();
    const { status, notes } = body;

    if (!id) {
      return NextResponse.json(
        { error: "Order ID is required" },
        { status: 400 }
      );
    }

    if (!status) {
      return NextResponse.json(
        { error: "Status is required" },
        { status: 400 }
      );
    }

    // Get user to determine role
    const user = await db.user.findUnique({
      where: {
        clerkUserId: userId,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Find the order
    const order = await db.medicineOrder.findUnique({
      where: {
        id,
      },
    });

    if (!order) {
      return NextResponse.json(
        { error: "Order not found" },
        { status: 404 }
      );
    }

    // Check permissions based on user role
    if (user.role === "PATIENT" && order.patientId !== user.id) {
      return NextResponse.json(
        { error: "Not authorized to update this order" },
        { status: 403 }
      );
    }

    if (user.role === "MEDICINE_STORE" && order.storeId !== user.id) {
      return NextResponse.json(
        { error: "Not authorized to update this order" },
        { status: 403 }
      );
    }

    // Validate status transition
    const validStatuses = [
      "PENDING",
      "CONFIRMED",
      "PREPARING",
      "READY_FOR_PICKUP",
      "DELIVERED",
      "CANCELLED",
    ];

    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: "Invalid status" },
        { status: 400 }
      );
    }

    // For patients, they can only cancel orders
    if (user.role === "PATIENT") {
      if (status !== "CANCELLED") {
        return NextResponse.json(
          { error: "Patients can only cancel orders" },
          { status: 400 }
        );
      }

      // Check if order can be cancelled
      if (order.status === "DELIVERED" || order.status === "CANCELLED") {
        return NextResponse.json(
          { error: "Order cannot be cancelled at this stage" },
          { status: 400 }
        );
      }
    }

    // For stores, they cannot cancel orders (only patients can)
    if (user.role === "MEDICINE_STORE" && status === "CANCELLED") {
      return NextResponse.json(
        { error: "Stores cannot cancel orders" },
        { status: 400 }
      );
    }

    // Update order
    const updatedOrder = await db.medicineOrder.update({
      where: {
        id,
      },
      data: {
        status,
        notes: notes || order.notes,
        deliveryDate: status === "DELIVERED" ? new Date() : order.deliveryDate,
      },
    });

    return NextResponse.json({
      success: true,
      order: updatedOrder
    });
  } catch (error) {
    console.error("Failed to update medicine order:", error);
    return NextResponse.json(
      { error: "Failed to update medicine order" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/medicine-orders/[id] - Cancel order (patient only)
 */
export async function DELETE(request, { params }) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id } = params;

    if (!id) {
      return NextResponse.json(
        { error: "Order ID is required" },
        { status: 400 }
      );
    }

    // Check if user is a patient
    const user = await db.user.findUnique({
      where: {
        clerkUserId: userId,
        role: "PATIENT",
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Patient access required" },
        { status: 403 }
      );
    }

    // Find the order
    const order = await db.medicineOrder.findFirst({
      where: {
        id,
        patientId: user.id,
      },
    });

    if (!order) {
      return NextResponse.json(
        { error: "Order not found" },
        { status: 404 }
      );
    }

    // Check if order can be cancelled
    if (order.status === "DELIVERED" || order.status === "CANCELLED") {
      return NextResponse.json(
        { error: "Order cannot be cancelled at this stage" },
        { status: 400 }
      );
    }

    // Update order status to cancelled
    const updatedOrder = await db.medicineOrder.update({
      where: {
        id,
      },
      data: {
        status: "CANCELLED",
      },
    });

    return NextResponse.json({
      success: true,
      order: updatedOrder
    });
  } catch (error) {
    console.error("Failed to cancel medicine order:", error);
    return NextResponse.json(
      { error: "Failed to cancel medicine order" },
      { status: 500 }
    );
  }
}
