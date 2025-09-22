import { NextResponse } from "next/server";
import { getDoctorAppointments } from "@/actions/doctor";

export async function GET() {
  try {
    const result = await getDoctorAppointments();

    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("Doctor appointments API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
