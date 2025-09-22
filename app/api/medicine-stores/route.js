import { NextResponse } from "next/server";
import { db } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";

/**
 * GET /api/medicine-stores - Get all verified medicine stores
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
        createdAt: true,
      },
    });

    return NextResponse.json({ stores });
  } catch (error) {
    console.error("Failed to fetch medicine stores:", error);
    return NextResponse.json(
      { error: "Failed to fetch medicine stores" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/medicine-stores - Create a new medicine store (admin only)
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

    // Check if user is admin
    const user = await db.user.findUnique({
      where: {
        clerkUserId: userId,
      },
    });

    if (!user || user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      clerkUserId,
      storeName,
      storeAddress,
      storePhone,
      storeLicense,
      storeDescription,
    } = body;

    if (!clerkUserId || !storeName || !storeAddress || !storePhone || !storeLicense) {
      return NextResponse.json(
        { error: "All required fields must be provided" },
        { status: 400 }
      );
    }

    // Check if user exists
    const targetUser = await db.user.findUnique({
      where: {
        clerkUserId,
      },
    });

    if (!targetUser) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    if (targetUser.role !== "UNASSIGNED") {
      return NextResponse.json(
        { error: "User already has a role assigned" },
        { status: 400 }
      );
    }

    // Update user to medicine store role
    const updatedUser = await db.user.update({
      where: {
        clerkUserId,
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

    return NextResponse.json({
      success: true,
      store: updatedUser
    });
  } catch (error) {
    console.error("Failed to create medicine store:", error);
    return NextResponse.json(
      { error: "Failed to create medicine store" },
      { status: 500 }
    );
  }
}
