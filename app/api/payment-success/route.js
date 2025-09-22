import { NextResponse } from "next/server";
import { db } from "@/lib/prisma";
import { currentUser } from "@clerk/nextjs/server";

export async function POST(request) {
  try {
    const user = await currentUser();
    const { paymentIntentId, creditAmount } = await request.json();

    if (!user || !paymentIntentId || !creditAmount) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Update user credits
    const updatedUser = await db.user.update({
      where: {
        clerkUserId: user.id,
      },
      data: {
        credits: {
          increment: parseInt(creditAmount),
        },
      },
    });

    // Log the credit purchase
    await db.creditTransaction.create({
      data: {
        userId: updatedUser.id,
        amount: parseInt(creditAmount),
        type: "CREDIT_PURCHASE",
        packageId: paymentIntentId,
      },
    });

    return NextResponse.json({
      success: true,
      credits: updatedUser.credits,
    });
  } catch (error) {
    console.error("Error processing payment success:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
