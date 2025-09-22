"use server";

import { db } from "@/lib/prisma";
import { auth, currentUser } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";

/**
 * Sets the user's role and related information
 */
export async function setUserRole(formData) {
  const { userId } = await auth();

  if (!userId) {
    throw new Error("Unauthorized");
  }

  // Find user in our database
  let user = await db.user.findUnique({
    where: { clerkUserId: userId },
  });

  // If user doesn't exist, create them
  if (!user) {
    try {
      const clerkUser = await currentUser();

      if (!clerkUser) {
        throw new Error("Unable to fetch user data from Clerk");
      }

      const userEmail = clerkUser.emailAddresses[0]?.emailAddress || "";

      if (!userEmail) {
        throw new Error("No email address found for user");
      }

      // Check if user exists with this email but different clerkUserId
      const existingUserByEmail = await db.user.findUnique({
        where: { email: userEmail },
      });

      if (existingUserByEmail) {
        // User exists with this email, update their clerkUserId
        user = await db.user.update({
          where: { email: userEmail },
          data: {
            clerkUserId: userId,
            name: `${clerkUser.firstName || ""} ${clerkUser.lastName || ""}`.trim(),
            imageUrl: clerkUser.imageUrl || "",
          },
        });

        console.log(`Updated existing user with new clerkUserId: ${user.id}`);
      } else {
        // Create new user in database
        user = await db.user.create({
          data: {
            clerkUserId: userId,
            email: userEmail,
            name: `${clerkUser.firstName || ""} ${clerkUser.lastName || ""}`.trim(),
            imageUrl: clerkUser.imageUrl || "",
            role: "UNASSIGNED",
          },
        });

        console.log(`Created new user in database: ${user.id}`);
      }
    } catch (error) {
      console.error("Failed to create or update user:", error);
      throw new Error(`Failed to create user profile: ${error.message}`);
    }
  }

  if (!user) throw new Error("User not found in database");

  const role = formData.get("role");

  if (!role || !["PATIENT", "DOCTOR"].includes(role)) {
    throw new Error("Invalid role selection");
  }

  try {
    // For patient role - simple update
    if (role === "PATIENT") {
      await db.user.update({
        where: {
          clerkUserId: userId,
        },
        data: {
          role: "PATIENT",
        },
      });

      revalidatePath("/");
      return { success: true, redirect: "/doctors" };
    }

    // For doctor role - need additional information
    if (role === "DOCTOR") {
      const specialty = formData.get("specialty");
      const experience = parseInt(formData.get("experience"), 10);
      const credentialUrl = formData.get("credentialUrl");
      const description = formData.get("description");

      // Validate inputs
      if (!specialty || !experience || !credentialUrl || !description) {
        throw new Error("All fields are required");
      }

      await db.user.update({
        where: {
          clerkUserId: userId,
        },
        data: {
          role: "DOCTOR",
          specialty,
          experience,
          credentialUrl,
          description,
          verificationStatus: "PENDING",
        },
      });

      revalidatePath("/");
      return { success: true, redirect: "/doctor/verification" };
    }
  } catch (error) {
    console.error("Failed to set user role:", error);
    throw new Error(`Failed to update user profile: ${error.message}`);
  }
}

/**
 * Gets the current user's complete profile information
 */
export async function getCurrentUser() {
  const { userId } = await auth();

  if (!userId) {
    return null;
  }

  try {
    let user = await db.user.findUnique({
      where: {
        clerkUserId: userId,
      },
    });

    // If user doesn't exist in our database, create them
    if (!user) {
      const clerkUser = await currentUser();

      if (clerkUser) {
        const userEmail = clerkUser.emailAddresses[0]?.emailAddress || "";

        if (!userEmail) {
          console.error("No email address found for user in getCurrentUser");
          return null;
        }

        // Check if user exists with this email but different clerkUserId
        const existingUserByEmail = await db.user.findUnique({
          where: { email: userEmail },
        });

        if (existingUserByEmail) {
          // User exists with this email, update their clerkUserId
          user = await db.user.update({
            where: { email: userEmail },
            data: {
              clerkUserId: userId,
              name: `${clerkUser.firstName || ""} ${clerkUser.lastName || ""}`.trim(),
              imageUrl: clerkUser.imageUrl || "",
            },
          });

          console.log(`Updated existing user with new clerkUserId via getCurrentUser: ${user.id}`);
        } else {
          // Create new user in database
          user = await db.user.create({
            data: {
              clerkUserId: userId,
              email: userEmail,
              name: `${clerkUser.firstName || ""} ${clerkUser.lastName || ""}`.trim(),
              imageUrl: clerkUser.imageUrl || "",
              role: "UNASSIGNED",
            },
          });

          console.log(`Created new user in database via getCurrentUser: ${user.id}`);
        }
      }
    }

    return user;
  } catch (error) {
    console.error("Failed to get user information:", error);
    return null;
  }
}
