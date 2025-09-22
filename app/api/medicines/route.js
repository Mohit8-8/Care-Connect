import { NextResponse } from "next/server";
import { db } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";

/**
 * GET /api/medicines - Get medicines with optional filtering
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
    const storeId = searchParams.get("storeId");
    const category = searchParams.get("category");
    const search = searchParams.get("search");
    const limit = parseInt(searchParams.get("limit")) || 50;

    let whereClause = {
      isActive: true,
      stock: {
        gt: 0,
      },
    };

    // Add store filter if provided
    if (storeId) {
      whereClause.storeId = storeId;
    }

    // Add category filter if provided
    if (category) {
      whereClause.medicine = {
        category: {
          contains: category,
          mode: "insensitive",
        },
      };
    }

    // Add search filter if provided
    if (search && search.trim().length >= 2) {
      whereClause.medicine = {
        ...whereClause.medicine,
        OR: [
          {
            name: {
              contains: search,
              mode: "insensitive",
            },
          },
          {
            genericName: {
              contains: search,
              mode: "insensitive",
            },
          },
          {
            category: {
              contains: search,
              mode: "insensitive",
            },
          },
        ],
      };
    }

    const medicines = await db.medicineStoreInventory.findMany({
      where: whereClause,
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
      take: limit,
    });

    return NextResponse.json({ medicines });
  } catch (error) {
    console.error("Failed to fetch medicines:", error);
    return NextResponse.json(
      { error: "Failed to fetch medicines" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/medicines - Add medicine to store inventory (store owner only)
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

    // Check if user is a medicine store
    const store = await db.user.findUnique({
      where: {
        clerkUserId: userId,
        role: "MEDICINE_STORE",
      },
    });

    if (!store) {
      return NextResponse.json(
        { error: "Medicine store access required" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      medicineName,
      genericName,
      category,
      description,
      manufacturer,
      dosage,
      price,
      stock,
      minStockLevel,
    } = body;

    if (!medicineName || !category || !price || !stock) {
      return NextResponse.json(
        { error: "Medicine name, category, price, and stock are required" },
        { status: 400 }
      );
    }

    if (price <= 0 || stock < 0) {
      return NextResponse.json(
        { error: "Price must be greater than 0 and stock cannot be negative" },
        { status: 400 }
      );
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

    return NextResponse.json({
      success: true,
      inventory
    });
  } catch (error) {
    console.error("Failed to add medicine to inventory:", error);
    return NextResponse.json(
      { error: "Failed to add medicine to inventory" },
      { status: 500 }
    );
  }
}
