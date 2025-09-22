import { NextResponse } from "next/server";
import { createReport, getPatientReports, getDoctorReports } from "@/actions/reports";

// GET /api/reports - Get reports (patient or doctor)
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type"); // "patient" or "doctor"

    if (type === "patient") {
      const result = await getPatientReports();
      if (result.error) {
        return NextResponse.json({ error: result.error }, { status: 400 });
      }
      return NextResponse.json(result);
    } else if (type === "doctor") {
      const result = await getDoctorReports();
      if (result.error) {
        return NextResponse.json({ error: result.error }, { status: 400 });
      }
      return NextResponse.json(result);
    } else {
      return NextResponse.json(
        { error: "Type parameter required (patient or doctor)" },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error("Reports API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST /api/reports - Create a new report
export async function POST(request) {
  try {
    const formData = await request.formData();
    const appointmentId = formData.get("appointmentId");
    const title = formData.get("title");
    const description = formData.get("description");
    const file = formData.get("file");

    if (!appointmentId || !title || !file) {
      return NextResponse.json(
        { error: "Missing required fields: appointmentId, title, file" },
        { status: 400 }
      );
    }

    // Validate file type
    const allowedTypes = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "image/jpeg",
      "image/png",
      "image/gif",
    ];

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "Invalid file type. Allowed: PDF, DOC, DOCX, JPEG, PNG, GIF" },
        { status: 400 }
      );
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: "File size too large. Maximum 10MB allowed" },
        { status: 400 }
      );
    }

    const result = await createReport(appointmentId, title, description, file);
    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error("Create report API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
