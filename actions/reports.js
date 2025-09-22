"use server";

import { db } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { v2 as cloudinary } from "cloudinary";

// Configure Cloudinary using URL
cloudinary.config({
  cloud_name: "ds2pcwj9x",
  api_key: "484496911935951",
  api_secret: "Q9N07eU-mOpmSATM4Gu2KV958YA",
});

/**
 * Upload a report file to Cloudinary
 */
async function uploadReportToCloudinary(file) {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    return new Promise((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        {
          resource_type: "auto",
          folder: "medical_reports",
        },
        (error, result) => {
          if (error) {
            reject(error);
          } else {
            resolve(result);
          }
        }
      ).end(buffer);
    });
  } catch (error) {
    throw new Error("Failed to upload file to Cloudinary");
  }
}

/**
 * Create a new medical report
 */
export async function createReport(appointmentId, title, description, file) {
  const { userId } = await auth();

  if (!userId) {
    throw new Error("Unauthorized");
  }

  try {
    // Verify user is a doctor
    const user = await db.user.findUnique({
      where: {
        clerkUserId: userId,
        role: "DOCTOR",
      },
    });

    if (!user) {
      throw new Error("Only doctors can create reports");
    }

    // Verify appointment exists and belongs to this doctor
    const appointment = await db.appointment.findFirst({
      where: {
        id: appointmentId,
        doctorId: user.id,
        status: "COMPLETED",
      },
      include: {
        patient: true,
      },
    });

    if (!appointment) {
      throw new Error("Appointment not found or not completed");
    }

    // Upload file to Cloudinary
    const uploadResult = await uploadReportToCloudinary(file);

    // Create report record
    const report = await db.report.create({
      data: {
        appointmentId,
        doctorId: user.id,
        patientId: appointment.patientId,
        title,
        description,
        fileUrl: uploadResult.secure_url,
        fileType: file.type,
        fileSize: file.size,
        status: "APPROVED", // Auto-approve for now
      },
      include: {
        doctor: {
          select: {
            name: true,
            specialty: true,
          },
        },
        patient: {
          select: {
            name: true,
          },
        },
      },
    });

    return { report };
  } catch (error) {
    console.error("Failed to create report:", error);
    return { error: error.message || "Failed to create report" };
  }
}

/**
 * Get all reports for a patient
 */
export async function getPatientReports() {
  const { userId } = await auth();

  if (!userId) {
    throw new Error("Unauthorized");
  }

  try {
    const user = await db.user.findUnique({
      where: {
        clerkUserId: userId,
        role: "PATIENT",
      },
    });

    if (!user) {
      throw new Error("Patient not found");
    }

    const reports = await db.report.findMany({
      where: {
        patientId: user.id,
      },
      include: {
        doctor: {
          select: {
            name: true,
            specialty: true,
            imageUrl: true,
          },
        },
        appointment: {
          select: {
            startTime: true,
            endTime: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return { reports };
  } catch (error) {
    console.error("Failed to get patient reports:", error);
    return { error: "Failed to fetch reports" };
  }
}

/**
 * Get all reports created by a doctor
 */
export async function getDoctorReports() {
  const { userId } = await auth();

  if (!userId) {
    throw new Error("Unauthorized");
  }

  try {
    const user = await db.user.findUnique({
      where: {
        clerkUserId: userId,
        role: "DOCTOR",
      },
    });

    if (!user) {
      throw new Error("Doctor not found");
    }

    const reports = await db.report.findMany({
      where: {
        doctorId: user.id,
      },
      include: {
        patient: {
          select: {
            name: true,
            imageUrl: true,
          },
        },
        appointment: {
          select: {
            startTime: true,
            endTime: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return { reports };
  } catch (error) {
    console.error("Failed to get doctor reports:", error);
    return { error: "Failed to fetch reports" };
  }
}

/**
 * Get a specific report by ID
 */
export async function getReportById(reportId) {
  const { userId } = await auth();

  if (!userId) {
    throw new Error("Unauthorized");
  }

  try {
    const user = await db.user.findUnique({
      where: {
        clerkUserId: userId,
      },
    });

    if (!user) {
      throw new Error("User not found");
    }

    const report = await db.report.findFirst({
      where: {
        id: reportId,
        OR: [
          { patientId: user.id },
          { doctorId: user.id },
        ],
      },
      include: {
        doctor: {
          select: {
            name: true,
            specialty: true,
            imageUrl: true,
          },
        },
        patient: {
          select: {
            name: true,
            imageUrl: true,
          },
        },
        appointment: {
          select: {
            startTime: true,
            endTime: true,
          },
        },
      },
    });

    if (!report) {
      throw new Error("Report not found or access denied");
    }

    return { report };
  } catch (error) {
    console.error("Failed to get report:", error);
    return { error: error.message || "Failed to fetch report" };
  }
}

/**
 * Delete a report
 */
export async function deleteReport(reportId) {
  const { userId } = await auth();

  if (!userId) {
    throw new Error("Unauthorized");
  }

  try {
    const user = await db.user.findUnique({
      where: {
        clerkUserId: userId,
        role: "DOCTOR",
      },
    });

    if (!user) {
      throw new Error("Only doctors can delete reports");
    }

    // Get report to extract Cloudinary public_id for deletion
    const report = await db.report.findFirst({
      where: {
        id: reportId,
        doctorId: user.id,
      },
    });

    if (!report) {
      throw new Error("Report not found or access denied");
    }

    // Delete from Cloudinary
    const publicId = report.fileUrl.split('/').pop().split('.')[0];
    await cloudinary.uploader.destroy(`medical_reports/${publicId}`);

    // Delete from database
    await db.report.delete({
      where: {
        id: reportId,
      },
    });

    return { success: true };
  } catch (error) {
    console.error("Failed to delete report:", error);
    return { error: error.message || "Failed to delete report" };
  }
}
