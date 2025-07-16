"use server";
import { connectDB } from "@/lib/dbConnect";
import User from "@/models/User";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";

//verify is User has admin role
export async function verifyAdmin() {
  const { userId } = await auth();
  if (!userId) {
    return false;
  }
  try {
    //find user in database
    await connectDB();
    const user = await User.findOne({ clerkUserId: userId });
    return user?.role === "ADMIN";
  } catch (error) {
    console.error("Fail to verify Admin", error);
    return false;
  }
}

//get all doctor with pending verification
export async function getPendingDoctors() {
  const isAdmin = await verifyAdmin();
  if (!isAdmin) throw new Error("Unauthrized");
  try {
    await connectDB();
    const pendingDoctors = await User.find({
      role: "DOCTOR",
      verificationStatus: "PENDING",
    }).sort({ createdAt: -1 });
    return { doctors: pendingDoctors };
  } catch (error) {
    throw new Error("Failed to fetch pending doctors");
  }
}

//get all verified doctors
export async function getVerifiedDoctors() {
  const isAdmin = await verifyAdmin();
  if (!isAdmin) throw new Error("Unauthrized");
  try {
    await connectDB();
    const verifiedDoctors = await User.find({
      role: "DOCTOR",
      verificationStatus: "VERIFIED",
    }).sort({ name: 1 });
    return { doctors: verifiedDoctors };
  } catch (error) {
    console.error("Failed to get verified doctors:", error);
    return { error: "Failed to fetch verified doctors" };
  }
}

//Update a doctor's verification status
export async function updateDoctorStatus(formData) {
  const isAdmin = await verifyAdmin();
  if (!isAdmin) throw new Error("Unauthorized");

  const doctorId = formData.get("doctorId");
  const status = formData.get("status");

  if (!doctorId || !["VERIFIED", "REJECTED"].includes(status)) {
    throw new Error("Invalid input");
  }

  try {
    await connectDB();
    await User.updateOne(
      { _id: doctorId },
      { $set: { verificationStatus: status } }
    );

    revalidatePath("/admin");
    return { success: true };
  } catch (error) {
    console.error("Failed to update doctor status:", error);
    throw new Error(`Failed to update doctor status: ${error.message}`);
  }
}

//Suspends or reinstates a doctor
export async function updateDoctorActiveStatus(formData) {
  const isAdmin = await verifyAdmin();
  if (!isAdmin) throw new Error("Unauthorized");

  const doctorId = formData.get("doctorId");
  const suspend = formData.get("suspend") === "true";

  if (!doctorId) {
    throw new Error("Doctor ID is required");
  }

  try {
    const status = suspend ? "PENDING" : "VERIFIED";

    await User.updateOne(
      {
        _id: doctorId,
      },
      {
        $set: { verificationStatus: status },
      }
    );

    revalidatePath("/admin");
    return { success: true };
  } catch (error) {
    console.error("Failed to update doctor active status:", error);
    throw new Error(`Failed to update doctor status: ${error.message}`);
  }
}
