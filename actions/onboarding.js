"use server";
import { connectDB } from "@/lib/dbConnect";
import User from "@/models/User";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";

export async function setUserRole(formData) {
  const { userId } = await auth();
  if (!userId) {
    throw new Error("Unauthorized");
  }

  //find user in database
  await connectDB();
  const user = await User.findOne({ clerkUserId: userId });

  if (!user) {
    throw new Error("User not found in database");
  }

  const role = formData.get("role");
  if (!role || !["PATIENT", "DOCTOR"].includes(role)) {
    throw new Error("Invalid role selection");
  }

  try {
    if (role === "PATIENT") {
      await User.findOneAndUpdate({ clerkUserId: userId }, { role: "PATIENT" });
      revalidatePath("/");
      return { success: true, redirect: "/doctors" };
    }
    if (role === "DOCTOR") {
      const specialty = formData.get("specialty");
      const experience = parseInt(formData.get("experience"), 10);
      const credentialUrl = formData.get("credentialUrl");
      const description = formData.get("description");
      if (!specialty || !experience || !credentialUrl || !description) {
        throw new Error("All fields are required");
      }
      await User.findOneAndUpdate(
        { clerkUserId: userId },
        {
          role: "DOCTOR",
          specialty,
          experience,
          credentialUrl,
          description,
          verificationStatus: "PENDING",
        }
      );
      revalidatePath("/");
      return { success: true, redirect: "/doctor/verification" };
    }
  } catch (error) {
    console.error("Failed to set user role:", error);
    throw new Error(`Failed to update user profile:${error.message}`);
  }
}

export async function getCurrentUser() {
  const { userId } = await auth();
  if (!userId) {
    throw new Error("Unauthorized");
  }
  try {
    //find user in database
    await connectDB();
    const user = await User.findOne({ clerkUserId: userId });
    return user;
  } catch (error) {
    console.error("Failed to get user Information:", error);
    return null;
  }
}
