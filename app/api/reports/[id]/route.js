import { NextResponse } from "next/server";
import { getReportById, deleteReport } from "@/actions/reports";

// GET /api/reports/[id] - Get a specific report
export async function GET(request, { params }) {
  try {
    const { id } = await params;
    const result = await getReportById(id);

    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("Get report API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE /api/reports/[id] - Delete a report
export async function DELETE(request, { params }) {
  try {
    const { id } = await params;
    const result = await deleteReport(id);

    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("Delete report API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
