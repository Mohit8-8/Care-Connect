import { NextResponse } from "next/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2024-12-18.acacia",
});

export async function POST(request) {
  try {
    const { amount, planName, creditAmount } = await request.json();

    if (!amount || !planName) {
      return NextResponse.json(
        { error: "Amount and plan name are required" },
        { status: 400 }
      );
    }

    // Create a PaymentIntent with the order amount and currency
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount, // Amount in cents
      currency: "usd",
      metadata: {
        planName,
        creditAmount: creditAmount.toString(),
      },
    });

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
    });
  } catch (error) {
    console.error("Error creating payment intent:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
