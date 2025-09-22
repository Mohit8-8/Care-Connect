"use server";

import { db } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";

/**
 * Create a new medicine store profile
 */
export async function createMedicineStore(formData) {
  const { userId } = await auth();

  if (!userId) {
    throw new Error("Unauthorized");
  }

  try {
    const user = await db.user.findUnique({
      where: {
        clerkUserId: userId,
      },
    });

    if (!user) {
      throw new Error("User not found");
    }

    if (user.role !== "UNASSIGNED") {
      throw new Error("User already has a role assigned");
    }

    // Get form data
    const storeName = formData.get("storeName");
    const storeAddress = formData.get("storeAddress");
    const storePhone = formData.get("storePhone");
    const storeLicense = formData.get("storeLicense");
    const storeDescription = formData.get("storeDescription");

    // Validate required fields
    if (!storeName || !storeAddress || !storePhone || !storeLicense) {
      throw new Error("All fields are required");
    }

    // Update user to medicine store role
    const updatedUser = await db.user.update({
      where: {
        clerkUserId: userId,
      },
      data: {
        role: "MEDICINE_STORE",
        storeName,
        storeAddress,
        storePhone,
        storeLicense,
        storeDescription,
        storeVerificationStatus: "PENDING",
      },
    });

    revalidatePath("/onboarding");
    return { success: true, user: updatedUser };
  } catch (error) {
    console.error("Failed to create medicine store:", error);
    throw new Error("Failed to create medicine store: " + error.message);
  }
}

/**
 * Get medicine store profile
 */
export async function getMedicineStoreProfile() {
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
      select: {
        id: true,
        name: true,
        email: true,
        imageUrl: true,
        storeName: true,
        storeAddress: true,
        storePhone: true,
        storeLicense: true,
        storeDescription: true,
        storeVerificationStatus: true,
        createdAt: true,
      },
    });

    if (!store) {
      throw new Error("Medicine store not found");
    }

    return { store };
  } catch (error) {
    console.error("Failed to get medicine store profile:", error);
    throw new Error("Failed to fetch store profile: " + error.message);
  }
}

/**
 * Update medicine store profile
 */
export async function updateMedicineStoreProfile(formData) {
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

    // Get form data
    const storeName = formData.get("storeName");
    const storeAddress = formData.get("storeAddress");
    const storePhone = formData.get("storePhone");
    const storeDescription = formData.get("storeDescription");

    // Validate required fields
    if (!storeName || !storeAddress || !storePhone) {
      throw new Error("Store name, address, and phone are required");
    }

    // Update store profile
    const updatedStore = await db.user.update({
      where: {
        clerkUserId: userId,
      },
      data: {
        storeName,
        storeAddress,
        storePhone,
        storeDescription,
      },
    });

    revalidatePath("/medicine-store");
    return { success: true, store: updatedStore };
  } catch (error) {
    console.error("Failed to update medicine store profile:", error);
    throw new Error("Failed to update store profile: " + error.message);
  }
}

/**
 * Get medicine store dashboard statistics
 */
export async function getMedicineStoreStats() {
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

    // Get total medicines in inventory
    const totalMedicines = await db.medicineStoreInventory.count({
      where: {
        storeId: store.id,
        isActive: true,
      },
    });

    // Get total orders
    const totalOrders = await db.medicineOrder.count({
      where: {
        storeId: store.id,
      },
    });

    // Get pending orders
    const pendingOrders = await db.medicineOrder.count({
      where: {
        storeId: store.id,
        status: {
          in: ["PENDING", "CONFIRMED", "PREPARING"],
        },
      },
    });

    // Get total revenue (completed orders)
    const revenueResult = await db.medicineOrder.aggregate({
      where: {
        storeId: store.id,
        status: "DELIVERED",
      },
      _sum: {
        totalAmount: true,
      },
    });

    // Get low stock items
    const lowStockItems = await db.medicineStoreInventory.count({
      where: {
        storeId: store.id,
        isActive: true,
        stock: {
          lte: db.medicineStoreInventory.fields.minStockLevel,
        },
      },
    });

    return {
      stats: {
        totalMedicines,
        totalOrders,
        pendingOrders,
        totalRevenue: revenueResult._sum.totalAmount || 0,
        lowStockItems,
      },
    };
  } catch (error) {
    console.error("Failed to get medicine store stats:", error);
    throw new Error("Failed to fetch store statistics: " + error.message);
  }
}

/**
 * Send medicine store verification to admin
 */
export async function sendVerificationToAdmin() {
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

    if (store.storeVerificationStatus === "VERIFIED") {
      throw new Error("Store is already verified");
    }

    if (store.storeVerificationStatus === "PENDING") {
      throw new Error("Verification is already pending review");
    }

    // Update verification status to pending
    const updatedStore = await db.user.update({
      where: {
        clerkUserId: userId,
      },
      data: {
        storeVerificationStatus: "PENDING",
      },
    });

    revalidatePath("/medicine-store/verification");
    return { success: true, store: updatedStore };
  } catch (error) {
    console.error("Failed to send verification to admin:", error);
    throw new Error("Failed to send verification: " + error.message);
  }
}
