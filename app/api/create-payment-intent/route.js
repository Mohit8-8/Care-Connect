import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    const { amount, planName, creditAmount } = await request.json();

    if (!amount || !planName) {
      return NextResponse.json(
        { error: "Amount and plan name are required" },
        { status: 400 }
      );
    }

    // Demo mode: Return mock payment intent data
    const mockClientSecret = `demo_payment_intent_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    return NextResponse.json({
      clientSecret: mockClientSecret,
      demo: true,
      message: "Demo mode: No actual payment processing"
    });
  } catch (error) {
    console.error("Error creating payment intent:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
