import { db } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";

/**
 * Get all appointments for the authenticated patient
 */
export async function getPatientAppointments() {
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
      select: {
        id: true,
      },
    });

    if (!user) {
      throw new Error("Patient not found");
    }

    const appointments = await db.appointment.findMany({
      where: {
        patientId: user.id,
      },
      include: {
        doctor: {
          select: {
            id: true,
            name: true,
            specialty: true,
            imageUrl: true,
          },
        },
      },
      orderBy: {
        startTime: "asc",
      },
    });

    return { appointments };
  } catch (error) {
    console.error("Failed to get patient appointments:", error);
    return { error: "Failed to fetch appointments" };
  }
}

/**
 * Get all verified medicine stores for patient browsing
 */
export async function getMedicineStores() {
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

    const stores = await db.user.findMany({
      where: {
        role: "MEDICINE_STORE",
        storeVerificationStatus: "VERIFIED",
      },
      select: {
        id: true,
        name: true,
        imageUrl: true,
        storeName: true,
        storeAddress: true,
        storePhone: true,
        storeDescription: true,
      },
    });

    return { stores };
  } catch (error) {
    console.error("Failed to get medicine stores:", error);
    return { error: "Failed to fetch medicine stores" };
  }
}

/**
 * Get all verified medicine stores (alias for getMedicineStores)
 */
export async function getVerifiedMedicineStores() {
  return await getMedicineStores();
}

/**
 * Get medicines from a specific store
 */
export async function getStoreMedicines(storeId) {
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

    // Verify store exists and is verified
    const store = await db.user.findFirst({
      where: {
        id: storeId,
        role: "MEDICINE_STORE",
        storeVerificationStatus: "VERIFIED",
      },
    });

    if (!store) {
      throw new Error("Medicine store not found or not verified");
    }

    const medicines = await db.medicineStoreInventory.findMany({
      where: {
        storeId: storeId,
        isActive: true,
        stock: {
          gt: 0,
        },
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

    return { medicines, store };
  } catch (error) {
    console.error("Failed to get store medicines:", error);
    return { error: "Failed to fetch medicines" };
  }
}

/**
 * Search medicines across all stores
 */
export async function searchMedicines(query) {
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

    if (!query || query.trim().length < 2) {
      return { medicines: [] };
    }

    const medicines = await db.medicineStoreInventory.findMany({
      where: {
        isActive: true,
        stock: {
          gt: 0,
        },
        medicine: {
          OR: [
            {
              name: {
                contains: query,
                mode: "insensitive",
              },
            },
            {
              genericName: {
                contains: query,
                mode: "insensitive",
              },
            },
            {
              category: {
                contains: query,
                mode: "insensitive",
              },
            },
          ],
        },
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
      orderBy: {
        medicine: {
          name: "asc",
        },
      },
    });

    return { medicines };
  } catch (error) {
    console.error("Failed to search medicines:", error);
    return { error: "Failed to search medicines" };
  }
}
