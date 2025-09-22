import { NextResponse } from "next/server";
import { db } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";

/**
 * GET /api/medicine-orders - Get orders based on user role
 */
export async function GET(request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");

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

    let whereClause = {};

    if (user.role === "PATIENT") {
      whereClause.patientId = user.id;
    } else if (user.role === "MEDICINE_STORE") {
      whereClause.storeId = user.id;
    } else {
      return NextResponse.json(
        { error: "Invalid user role for this operation" },
        { status: 403 }
      );
    }

    // Add status filter if provided
    if (status) {
      whereClause.status = status;
    }

    const orders = await db.medicineOrder.findMany({
      where: whereClause,
      include: {
        medicine: true,
        store: {
          select: {
            storeName: true,
            storePhone: true,
            storeAddress: true,
          },
        },
        patient: {
          select: {
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        orderDate: "desc",
      },
    });

    return NextResponse.json({ orders });
  } catch (error) {
    console.error("Failed to fetch medicine orders:", error);
    return NextResponse.json(
      { error: "Failed to fetch medicine orders" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/medicine-orders - Place a new medicine order (patient only)
 */
export async function POST(request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
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

    const body = await request.json();
    const { storeId, medicineId, quantity } = body;

    if (!storeId || !medicineId || !quantity) {
      return NextResponse.json(
        { error: "Store ID, medicine ID, and quantity are required" },
        { status: 400 }
      );
    }

    if (quantity <= 0) {
      return NextResponse.json(
        { error: "Quantity must be greater than 0" },
        { status: 400 }
      );
    }

    // Get store and medicine details
    const store = await db.user.findUnique({
      where: {
        id: storeId,
        role: "MEDICINE_STORE",
      },
    });

    if (!store) {
      return NextResponse.json(
        { error: "Medicine store not found" },
        { status: 404 }
      );
    }

    const medicine = await db.medicine.findUnique({
      where: {
        id: medicineId,
      },
    });

    if (!medicine) {
      return NextResponse.json(
        { error: "Medicine not found" },
        { status: 404 }
      );
    }

    // Get inventory details
    const inventory = await db.medicineStoreInventory.findUnique({
      where: {
        storeId_medicineId: {
          storeId,
          medicineId,
        },
      },
    });

    if (!inventory || !inventory.isActive) {
      return NextResponse.json(
        { error: "Medicine not available in this store" },
        { status: 400 }
      );
    }

    if (inventory.stock < quantity) {
      return NextResponse.json(
        { error: "Insufficient stock available" },
        { status: 400 }
      );
    }

    const unitPrice = inventory.price;
    const totalAmount = unitPrice * quantity;

    // Create the order
    const order = await db.medicineOrder.create({
      data: {
        patientId: user.id,
        storeId,
        medicineId,
        quantity,
        unitPrice,
        totalAmount,
      },
      include: {
        medicine: true,
        store: {
          select: {
            storeName: true,
            storePhone: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      order
    });
  } catch (error) {
    console.error("Failed to place medicine order:", error);
    return NextResponse.json(
      { error: "Failed to place medicine order" },
      { status: 500 }
    );
  }
}
