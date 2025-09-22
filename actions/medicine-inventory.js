"use server";

import { db } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";

/**
 * Add medicine to store inventory
 */
export async function addMedicineToInventory(formData) {
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
    const medicineName = formData.get("medicineName");
    const genericName = formData.get("genericName");
    const category = formData.get("category");
    const description = formData.get("description");
    const manufacturer = formData.get("manufacturer");
    const dosage = formData.get("dosage");
    const price = parseFloat(formData.get("price"));
    const stock = parseInt(formData.get("stock"));
    const minStockLevel = parseInt(formData.get("minStockLevel"));

    // Validate required fields
    if (!medicineName || !category || !price || !stock) {
      throw new Error("Medicine name, category, price, and stock are required");
    }

    if (price <= 0 || stock < 0) {
      throw new Error("Price must be greater than 0 and stock cannot be negative");
    }

    // Check if medicine already exists
    let medicine = await db.medicine.findFirst({
      where: {
        name: medicineName,
        category: category,
      },
    });

    // If medicine doesn't exist, create it
    if (!medicine) {
      medicine = await db.medicine.create({
        data: {
          name: medicineName,
          genericName: genericName || null,
          category,
          description: description || null,
          manufacturer: manufacturer || null,
          dosage: dosage || null,
        },
      });
    }

    // Check if store already has this medicine in inventory
    const existingInventory = await db.medicineStoreInventory.findUnique({
      where: {
        storeId_medicineId: {
          storeId: store.id,
          medicineId: medicine.id,
        },
      },
    });

    let inventory;
    if (existingInventory) {
      // Update existing inventory
      inventory = await db.medicineStoreInventory.update({
        where: {
          storeId_medicineId: {
            storeId: store.id,
            medicineId: medicine.id,
          },
        },
        data: {
          price,
          stock: existingInventory.stock + stock,
          minStockLevel: minStockLevel || existingInventory.minStockLevel,
        },
      });
    } else {
      // Create new inventory entry
      inventory = await db.medicineStoreInventory.create({
        data: {
          storeId: store.id,
          medicineId: medicine.id,
          price,
          stock,
          minStockLevel: minStockLevel || null,
        },
      });
    }

    revalidatePath("/medicine-store/inventory");
    return { success: true, inventory };
  } catch (error) {
    console.error("Failed to add medicine to inventory:", error);
    throw new Error("Failed to add medicine to inventory: " + error.message);
  }
}

/**
 * Update medicine inventory
 */
export async function updateMedicineInventory(formData) {
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

    const inventoryId = formData.get("inventoryId");
    const price = parseFloat(formData.get("price"));
    const stock = parseInt(formData.get("stock"));
    const minStockLevel = parseInt(formData.get("minStockLevel"));

    if (!inventoryId) {
      throw new Error("Inventory ID is required");
    }

    // Verify the inventory belongs to this store
    const inventory = await db.medicineStoreInventory.findFirst({
      where: {
        id: inventoryId,
        storeId: store.id,
      },
    });

    if (!inventory) {
      throw new Error("Inventory item not found");
    }

    if (price <= 0) {
      throw new Error("Price must be greater than 0");
    }

    // Update inventory
    const updatedInventory = await db.medicineStoreInventory.update({
      where: {
        id: inventoryId,
      },
      data: {
        price,
        stock,
        minStockLevel: minStockLevel || null,
      },
    });

    revalidatePath("/medicine-store/inventory");
    return { success: true, inventory: updatedInventory };
  } catch (error) {
    console.error("Failed to update medicine inventory:", error);
    throw new Error("Failed to update inventory: " + error.message);
  }
}

/**
 * Remove medicine from inventory
 */
export async function removeMedicineFromInventory(formData) {
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

    const inventoryId = formData.get("inventoryId");

    if (!inventoryId) {
      throw new Error("Inventory ID is required");
    }

    // Verify the inventory belongs to this store
    const inventory = await db.medicineStoreInventory.findFirst({
      where: {
        id: inventoryId,
        storeId: store.id,
      },
    });

    if (!inventory) {
      throw new Error("Inventory item not found");
    }

    // Check if there are any pending orders for this medicine
    const pendingOrders = await db.medicineOrder.count({
      where: {
        storeId: store.id,
        medicineId: inventory.medicineId,
        status: {
          in: ["PENDING", "CONFIRMED", "PREPARING"],
        },
      },
    });

    if (pendingOrders > 0) {
      throw new Error("Cannot remove medicine with pending orders");
    }

    // Deactivate the inventory item instead of deleting
    const updatedInventory = await db.medicineStoreInventory.update({
      where: {
        id: inventoryId,
      },
      data: {
        isActive: false,
      },
    });

    revalidatePath("/medicine-store/inventory");
    return { success: true, inventory: updatedInventory };
  } catch (error) {
    console.error("Failed to remove medicine from inventory:", error);
    throw new Error("Failed to remove medicine from inventory: " + error.message);
  }
}

/**
 * Get store inventory
 */
export async function getStoreInventory() {
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

    const inventory = await db.medicineStoreInventory.findMany({
      where: {
        storeId: store.id,
        isActive: true,
      },
      include: {
        medicine: true,
      },
      orderBy: {
        medicine: {
          name: "asc",
        },
      },
    });

    return { inventory };
  } catch (error) {
    console.error("Failed to get store inventory:", error);
    throw new Error("Failed to fetch inventory: " + error.message);
  }
}

/**
 * Get low stock alerts
 */
export async function getLowStockAlerts() {
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

    const lowStockItems = await db.medicineStoreInventory.findMany({
      where: {
        storeId: store.id,
        isActive: true,
        minStockLevel: {
          not: null,
        },
        stock: {
          lte: db.medicineStoreInventory.fields.minStockLevel,
        },
      },
      include: {
        medicine: true,
      },
    });

    return { lowStockItems };
  } catch (error) {
    console.error("Failed to get low stock alerts:", error);
    throw new Error("Failed to fetch low stock alerts: " + error.message);
  }
}
