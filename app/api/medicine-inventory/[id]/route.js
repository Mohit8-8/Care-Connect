import { NextResponse } from "next/server";
import { db } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";

/**
 * PATCH /api/medicine-inventory/[id] - Update medicine inventory stock
 */
export async function PATCH(request, { params }) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const inventoryId = params.id;
    const { stock } = await request.json();

    if (typeof stock !== 'number' || stock < 0) {
      return NextResponse.json(
        { error: "Stock must be a non-negative number" },
        { status: 400 }
      );
    }

    // Find the inventory item
    const inventory = await db.medicineStoreInventory.findUnique({
      where: {
        id: inventoryId,
      },
      include: {
        store: {
          select: {
            clerkUserId: true,
          },
        },
      },
    });

    if (!inventory) {
      return NextResponse.json(
        { error: "Inventory item not found" },
        { status: 404 }
      );
    }

    // Check if user owns this store (for store owners) or is admin
    const user = await db.user.findUnique({
      where: {
        clerkUserId: userId,
      },
    });

    if (user.role === "MEDICINE_STORE" && inventory.store.clerkUserId !== userId) {
      return NextResponse.json(
        { error: "Access denied" },
        { status: 403 }
      );
    }

    // Update the inventory stock
    const updatedInventory = await db.medicineStoreInventory.update({
      where: {
        id: inventoryId,
      },
      data: {
        stock,
      },
      include: {
        medicine: true,
        store: {
          select: {
            id: true,
            storeName: true,
            storeAddress: true,
            storePhone: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      inventory: updatedInventory
    });
  } catch (error) {
    console.error("Failed to update inventory stock:", error);
    return NextResponse.json(
      { error: "Failed to update inventory stock" },
      { status: 500 }
    );
  }
}
