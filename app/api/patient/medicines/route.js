import { NextResponse } from "next/server";
import { db } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";

/**
 * GET /api/patient/medicines - Get medicines for patient browsing
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

    // Verify user is a patient
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
