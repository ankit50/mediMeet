"use server";
import { auth } from "@clerk/nextjs/server";
import { format } from "date-fns";
import mongoose, { Mongoose } from "mongoose";
import User from "@/models/User";
import CreditTransaction from "@/models/CreditTransaction";
import { revalidatePath } from "next/cache";
import { connectDB } from "@/lib/dbConnect";

const PLAN_CREDITS = {
  free_user: 0,
  standard: 10,
  premium: 24,
};
// Each appointment costs 2 credits
const APPOINTMENT_CREDIT_COST = 2;
export async function checkAndAllocateCredits(user) {
  await connectDB();

  if (!user || user.role !== "PATIENT") {
    return user;
  }

  const { has } = await auth();

  // Determine plan
  const hasBasic = has({ plan: "free_user" });
  const hasStandard = has({ plan: "standard" });
  const hasPremium = has({ plan: "premium" });

  let currentPlan = null;
  let creditsToAllocate = 0;
  if (hasPremium) {
    currentPlan = "premium";
    creditsToAllocate = PLAN_CREDITS.premium;
  } else if (hasStandard) {
    currentPlan = "standard";
    creditsToAllocate = PLAN_CREDITS.standard;
  } else if (hasBasic) {
    currentPlan = "free_user";
    creditsToAllocate = PLAN_CREDITS.free_user;
  }
  if (!currentPlan) return user;
  const currentMonth = format(new Date(), "yyyy-MM");
  // Check latest transaction from DB
  const latestTx = await CreditTransaction.findOne({ user: user._id })
    .sort({ createdAt: -1 })
    .lean();

  if (latestTx) {
    const txMonth = format(new Date(latestTx.createdAt), "yyyy-MM");
    if (txMonth === currentMonth && latestTx.packageId === currentPlan) {
      return user; // Already allocated for this month
    }
  }
  const session = await mongoose.startSession();
  session.startTransaction();
  let committed = false;

  try {
    // 1. Create transaction
    await CreditTransaction.create(
      [
        {
          user: user._id,
          amount: creditsToAllocate,
          type: "CREDIT_PURCHASE",
          packageId: currentPlan,
        },
      ],
      { session }
    );

    // 2. Update user's credit balance
    const updatedUser = await User.findByIdAndUpdate(
      user._id,
      { $inc: { credits: creditsToAllocate } },
      { new: true, session }
    ).lean();

    await session.commitTransaction();
    committed = true;

    // revalidatePath("/doctors");
    // revalidatePath("/appointments");

    return updatedUser;
  } catch (err) {
    if (!committed) {
      await session.abortTransaction();
    }
    console.error("💥 Credit allocation failed:", err.message);
    return null;
  } finally {
    session.endSession(); // Safe to call always
  }
}

export async function deductCreditsForAppointment(userId, doctorId) {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();

    const user = await User.findById(userId).session(session);
    const doctor = await User.findById(doctorId).session(session);

    if (!user) throw new Error("User not found");
    if (!doctor) throw new Error("Doctor not found");

    // Ensure user has sufficient credits
    if (user.credits < APPOINTMENT_CREDIT_COST) {
      throw new Error("Insufficient credits to book an appointment");
    }

    // Deduct credits from patient and add to doctor
    await CreditTransaction.create(
      [
        {
          user: user._id,
          amount: -APPOINTMENT_CREDIT_COST,
          type: "APPOINTMENT_DEDUCTION",
        },
      ],
      { session }
    );

    // Create transaction record for doctor (addition)
    await CreditTransaction.create(
      [
        {
          user: doctor._id,
          amount: APPOINTMENT_CREDIT_COST,
          type: "APPOINTMENT_DEDUCTION",
        },
      ],
      { session }
    );

    // Update patient's credit balance (decrement)
    user.credits -= APPOINTMENT_CREDIT_COST;
    await user.save({ session });

    // Update doctor's credit balance (increment)
    doctor.credits += APPOINTMENT_CREDIT_COST;
    await doctor.save({ session });

    await session.commitTransaction();
    session.endSession();

    return { success: true, user };
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error("Failed to deduct credits:", error);
    return { success: false, error: error.message };
  }
}
