"use server";
import { connectDB } from "@/lib/dbConnect";
import Availability from "@/models/Availability";
import User from "@/models/User";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";

//Set doctor's availability slots
export async function setAvailabilitySlots(formData) {
  const { userId } = await auth();

  if (!userId) {
    throw new Error("Unauthorized");
  }

  try {
    // Get the doctor
    await connectDB();
    const doctor = await User.findOne({
      clerkUserId: userId,
      role: "DOCTOR",
    });

    if (!doctor) {
      throw new Error("Doctor not found");
    }

    // Get form data
    const startTime = formData.get("startTime");
    const endTime = formData.get("endTime");

    // Validate input
    if (!startTime || !endTime) {
      throw new Error("Start time and end time are required");
    }

    if (startTime >= endTime) {
      throw new Error("Start time must be before end time");
    }

    // Check if the doctor already has slots
    const existingSlots = await Availability.find({
      doctor: doctor._id,
    });

    // If slots exist, delete them all (we're replacing them)
    if (existingSlots.length > 0) {
      // Don't delete slots that already have appointments
      const slotsWithNoAppointments = existingSlots.filter(
        (slot) => !slot.appointment
      );

      if (slotsWithNoAppointments.length > 0) {
        await Availability.deleteMany({
          _id: { $in: slotsWithNoAppointments.map((slot) => slot._id) },
        });
      }
    }

    // Create new availability slot
    const newSlotDoc = await Availability.create({
      doctor: doctor._id,
      startTime,
      endTime,
      status: "AVAILABLE",
    });

    // Convert Mongoose document to plain object
    const newSlot = newSlotDoc.toObject();

    // Manually convert non-serializable fields
    newSlot._id = newSlot._id.toString();
    newSlot.doctor = newSlot.doctor.toString();
    newSlot.startTime = newSlot.startTime.toISOString();
    newSlot.endTime = newSlot.endTime.toISOString();
    newSlot.createdAt = newSlot.createdAt.toISOString();
    newSlot.updatedAt = newSlot.updatedAt.toISOString();

    revalidatePath("/doctor");
    return { success: true, slot: newSlot };
  } catch (error) {
    console.error("Failed to set availability slots:", error);
    throw new Error("Failed to set availability: eerf" + error.message);
  }
}

//Get doctor's current availability slots

export async function getDoctorAvailability() {
  const { userId } = await auth();

  if (!userId) {
    throw new Error("Unauthorized");
  }

  try {
    await connectDB();
    const doctor = await User.findOne({
      clerkUserId: userId,
      role: "DOCTOR",
    });

    if (!doctor) {
      throw new Error("Doctor not found");
    }

    const availabilitySlots = await Availability.find({
      doctor: doctor._id,
    }).sort({ startTime: 1 });

    return { slots: availabilitySlots };
  } catch (error) {
    throw new Error("Failed to fetch availability slots " + error.message);
  }
}

//Get doctor's upcoming appointments

export async function getDoctorAppointments() {
  return [];
}
