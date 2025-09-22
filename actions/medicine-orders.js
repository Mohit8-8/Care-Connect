"use server";

import { db } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";

/**
 * Place an order for medicines
 */
export async function placeMedicineOrder(formData) {
  const { userId } = await auth();

  if (!userId) {
    throw new Error("Unauthorized");
  }

  try {
    const user = await db.user.findUnique({
      where: {
        clerkUserId: userId,
        role: "PATIENT",
      },
    });

    if (!user) {
      throw new Error("Patient not found");
    }

    const storeId = formData.get("storeId");
    const medicineId = formData.get("medicineId");
    const quantity = parseInt(formData.get("quantity"));

    if (!storeId || !medicineId || !quantity) {
      throw new Error("Store ID, medicine ID, and quantity are required");
    }

    if (quantity <= 0) {
      throw new Error("Quantity must be greater than 0");
    }

    // Get store and medicine details
    const store = await db.user.findUnique({
      where: {
        id: storeId,
        role: "MEDICINE_STORE",
      },
    });

    if (!store) {
      throw new Error("Medicine store not found");
    }

    const medicine = await db.medicine.findUnique({
      where: {
        id: medicineId,
      },
    });

    if (!medicine) {
      throw new Error("Medicine not found");
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
      throw new Error("Medicine not available in this store");
    }

    if (inventory.stock < quantity) {
      throw new Error("Insufficient stock available");
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

    revalidatePath("/medicines");
    return { success: true, order };
  } catch (error) {
    console.error("Failed to place medicine order:", error);
    throw new Error("Failed to place order: " + error.message);
  }
}

/**
 * Get patient orders
 */
export async function getPatientOrders() {
  const { userId } = await auth();

  if (!userId) {
    throw new Error("Unauthorized");
  }

  try {
    const user = await db.user.findUnique({
      where: {
        clerkUserId: userId,
        role: "PATIENT",
      },
    });

    if (!user) {
      throw new Error("Patient not found");
    }

    const orders = await db.medicineOrder.findMany({
      where: {
        patientId: user.id,
      },
      include: {
        medicine: true,
        store: {
          select: {
            storeName: true,
            storePhone: true,
            storeAddress: true,
          },
        },
      },
      orderBy: {
        orderDate: "desc",
      },
    });

    return { orders };
  } catch (error) {
    console.error("Failed to get patient orders:", error);
    throw new Error("Failed to fetch orders: " + error.message);
  }
}

/**
 * Get store orders
 */
export async function getStoreOrders() {
  const { userId } = await auth();

  if (!userId) {
    throw new Error("Unauthorized");
  }

  try {
    const store = await db.user.findUnique({
      where: {
        clerkUserId: userId,
        role: "MEDICINE_STORE",
      },
    });

    if (!store) {
      throw new Error("Medicine store not found");
    }

    const orders = await db.medicineOrder.findMany({
      where: {
        storeId: store.id,
      },
      include: {
        medicine: true,
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

    return { orders };
  } catch (error) {
    console.error("Failed to get store orders:", error);
    throw new Error("Failed to fetch orders: " + error.message);
  }
}

/**
 * Update order status (store only)
 */
export async function updateOrderStatus(formData) {
  const { userId } = await auth();

  if (!userId) {
    throw new Error("Unauthorized");
  }

  try {
    const store = await db.user.findUnique({
      where: {
        clerkUserId: userId,
        role: "MEDICINE_STORE",
      },
    });

    if (!store) {
      throw new Error("Medicine store not found");
    }

    const orderId = formData.get("orderId");
    const status = formData.get("status");
    const notes = formData.get("notes");

    if (!orderId || !status) {
      throw new Error("Order ID and status are required");
    }

    // Verify the order belongs to this store
    const order = await db.medicineOrder.findFirst({
      where: {
        id: orderId,
        storeId: store.id,
      },
    });

    if (!order) {
      throw new Error("Order not found");
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
      throw new Error("Invalid status");
    }

    // Update order
    const updatedOrder = await db.medicineOrder.update({
      where: {
        id: orderId,
      },
      data: {
        status,
        notes: notes || order.notes,
        deliveryDate: status === "DELIVERED" ? new Date() : order.deliveryDate,
      },
    });

    revalidatePath("/medicine-store/orders");
    return { success: true, order: updatedOrder };
  } catch (error) {
    console.error("Failed to update order status:", error);
    throw new Error("Failed to update order status: " + error.message);
  }
}

/**
 * Cancel order (patient only)
 */
export async function cancelMedicineOrder(formData) {
  const { userId } = await auth();

  if (!userId) {
    throw new Error("Unauthorized");
  }

  try {
    const user = await db.user.findUnique({
      where: {
        clerkUserId: userId,
        role: "PATIENT",
      },
    });

    if (!user) {
      throw new Error("Patient not found");
    }

    const orderId = formData.get("orderId");

    if (!orderId) {
      throw new Error("Order ID is required");
    }

    // Find the order
    const order = await db.medicineOrder.findFirst({
      where: {
        id: orderId,
        patientId: user.id,
      },
    });

    if (!order) {
      throw new Error("Order not found");
    }

    // Check if order can be cancelled
    if (order.status === "DELIVERED" || order.status === "CANCELLED") {
      throw new Error("Order cannot be cancelled at this stage");
    }

    // Update order status to cancelled
    const updatedOrder = await db.medicineOrder.update({
      where: {
        id: orderId,
      },
      data: {
        status: "CANCELLED",
      },
    });

    revalidatePath("/medicine-orders");
    return { success: true, order: updatedOrder };
  } catch (error) {
    console.error("Failed to cancel medicine order:", error);
    throw new Error("Failed to cancel order: " + error.message);
  }
}

/**
 * Get order statistics for store
 */
export async function getOrderStatistics() {
  const { userId } = await auth();

  if (!userId) {
    throw new Error("Unauthorized");
  }

  try {
    const store = await db.user.findUnique({
      where: {
        clerkUserId: userId,
        role: "MEDICINE_STORE",
      },
    });

    if (!store) {
      throw new Error("Medicine store not found");
    }

    // Get order counts by status
    const orderStats = await db.medicineOrder.groupBy({
      by: ["status"],
      where: {
        storeId: store.id,
      },
      _count: {
        id: true,
      },
    });

    // Get total revenue
    const revenueResult = await db.medicineOrder.aggregate({
      where: {
        storeId: store.id,
        status: "DELIVERED",
      },
      _sum: {
        totalAmount: true,
      },
    });

    // Get recent orders (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentOrders = await db.medicineOrder.count({
      where: {
        storeId: store.id,
        orderDate: {
          gte: thirtyDaysAgo,
        },
      },
    });

    return {
      stats: {
        orderStats,
        totalRevenue: revenueResult._sum.totalAmount || 0,
        recentOrders,
      },
    };
  } catch (error) {
    console.error("Failed to get order statistics:", error);
    throw new Error("Failed to fetch order statistics: " + error.message);
  }
}
