import { NextResponse } from "next/server";
import { db } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";

/**
 * GET /api/patient/stores - Get verified medicine stores for patient browsing
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

    return NextResponse.json({ stores });
  } catch (error) {
    console.error("Failed to fetch medicine stores:", error);
    return NextResponse.json(
      { error: "Failed to fetch medicine stores" },
      { status: 500 }
    );
  }
}
