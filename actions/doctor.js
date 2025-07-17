"use server";
import { connectDB } from "@/lib/dbConnect";
import Appointment from "@/models/Appointment";
import Availability from "@/models/Availability";
import CreditTransaction from "@/models/CreditTransaction";
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

//Get doctto's time
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

    // ✅ Manually extract fields to ensure a plain object
    const plainSlots = availabilitySlots.map((slot) => ({
      id: slot._id.toString(), // convert ObjectId to string
      doctor: slot.doctor.toString(),
      startTime: slot.startTime.toISOString(),
      endTime: slot.endTime.toISOString(),
      status: slot.status,
      createdAt: slot.createdAt?.toISOString?.() || null,
      updatedAt: slot.updatedAt?.toISOString?.() || null,
    }));

    return { slots: plainSlots };
  } catch (error) {
    throw new Error("Failed to fetch availability slots " + error.message);
  }
}

//Get doctor's upcoming appointments
export async function getDoctorAppointments() {
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

    const appointmentsDocs = await Appointment.find({
      doctor: doctor._id,
      status: { $in: ["SCHEDULED"] },
    })
      .populate("patient")
      .sort({ startTime: 1 });

    const appointments = appointmentsDocs.map((doc) => ({
      _id: doc._id.toString(),
      doctor: doc.doctor.toString(),
      startTime: doc.startTime,
      endTime: doc.endTime,
      status: doc.status,
      notes: doc.notes,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
      patient: {
        _id: doc.patient._id.toString(),
        name: doc.patient.name,
        email: doc.patient.email,
        // Include other required fields from patient
      },
    }));

    return { appointments };
  } catch (error) {
    throw new Error("Failed to fetch appointments " + error.message);
  }
}

//Cancel an appointment (can be done by both doctor and patient)
export async function cancelAppointment(formData) {
  const { userId } = await auth();

  if (!userId) {
    throw new Error("Unauthorized");
  }

  try {
    await connectDB();
    const user = await User.findOne({
      clerkUserId: userId,
    });

    if (!user) {
      throw new Error("User not found");
    }

    const appointmentId = formData.get("appointmentId");

    if (!appointmentId) {
      throw new Error("Appointment ID is required");
    }

    // Find the appointment with both patient and doctor details
    const appointment = await Appointment.findById(appointmentId)
      .populate("patient")
      .populate("doctor");

    if (!appointment) {
      throw new Error("Appointment not found");
    }

    // Verify the user is either the doctor or the patient for this appointment
    if (
      appointment.doctor._id.toString() !== user._id.toString() &&
      appointment.patient._id.toString() !== user._id.toString()
    ) {
      throw new Error("You are not authorized to cancel this appointment");
    }

    // Start pseudo transaction
    const session = await Appointment.startSession();
    session.startTransaction();
    try {
      // Cancel appointment
      appointment.status = "CANCELLED";
      await appointment.save({ session });

      // Create credit transaction: refund patient
      await CreditTransaction.create(
        [
          {
            user: appointment.patient._id,
            amount: 2,
            type: "APPOINTMENT_DEDUCTION",
          },
        ],
        { session }
      );

      // Create credit transaction: deduct doctor
      await CreditTransaction.create(
        [
          {
            user: appointment.doctor._id,
            amount: -2,
            type: "APPOINTMENT_DEDUCTION",
          },
        ],
        { session }
      );

      // Update patient credit
      await User.findByIdAndUpdate(
        appointment.patient._id,
        {
          $inc: { credits: 2 },
        },
        { session }
      );

      // Update doctor credit
      await User.findByIdAndUpdate(
        appointment.doctor._id,
        {
          $inc: { credits: -2 },
        },
        { session }
      );

      await session.commitTransaction();
      session.endSession();
    } catch (err) {
      await session.abortTransaction();
      session.endSession();
      throw err;
    }

    // Revalidate based on role
    if (user.role === "DOCTOR") {
      revalidatePath("/doctor");
    } else if (user.role === "PATIENT") {
      revalidatePath("/appointments");
    }

    return { success: true };
  } catch (error) {
    console.error("Failed to cancel appointment:", error);
    throw new Error("Failed to cancel appointment: " + error.message);
  }
}

//Add appointment notes
export async function addAppointmentNotes(formData) {
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

    const appointmentId = formData.get("appointmentId");
    const notes = formData.get("notes");

    if (!appointmentId || !notes) {
      throw new Error("Appointment ID and notes are required");
    }

    // Verify the appointment belongs to this doctor
    const appointment = await Appointment.findOne({
      _id: appointmentId,
      doctor: doctor._id,
    });

    if (!appointment) {
      throw new Error("Appointment not found");
    }
    // Update the appointment notes
    appointment.notes = notes;
    await appointment.save();
    // ✅ Convert appointment to plain object manually
    const plainAppointment = {
      id: appointment._id.toString(),
      patient: appointment.patient.toString(),
      doctor: appointment.doctor.toString(),
      startTime: appointment.startTime.toISOString(),
      endTime: appointment.endTime.toISOString(),
      patientDescription: appointment.patientDescription,
      notes: appointment.notes,
      status: appointment.status,
      videoSessionId: appointment.videoSessionId,
      createdAt: appointment.createdAt.toISOString(),
      updatedAt: appointment.updatedAt.toISOString(),
    };

    revalidatePath("/doctor");

    return { success: true, appointment: plainAppointment };
  } catch (error) {
    throw new Error("Failed to update notes" + error.message);
  }
}

//Mark appointment competed
export async function markAppointmentCompleted(formData) {
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
    const appointmentId = formData.get("appointmentId");
    if (!appointmentId) {
      throw new Error("Appointment ID is required");
    }

    // Verify the appointment belongs to this doctor
    const appointment = await Appointment.findOne({
      _id: appointmentId,
      doctor: doctor._id,
    }).populate("patient");

    if (!appointment) {
      throw new Error("Appointment not found");
    }
    if (appointment.status !== "SCHEDULED") {
      throw new Error("Only scheduled appointments can be marked as completed");
    }
    const now = new Date();
    const appointmentEndTime = new Date(appointment.endTime);

    if (now < appointmentEndTime) {
      throw new Error(
        "Cannot mark appointment as completed before the scheduled end time"
      );
    }
    appointment.status = "COMPLETED";
    await appointment.save();
    revalidatePath("/doctor");
    return { success: true, appointment };
  } catch (error) {
    throw new Error("Failed to ipdate notes" + error.message);
  }
}
