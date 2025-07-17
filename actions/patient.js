import { connectDB } from "@/lib/dbConnect";
import Appointment from "@/models/Appointment";
import User from "@/models/User";
import { auth } from "@clerk/nextjs/server";

/**
 * Get all appointments for the authenticated patient
 */
export async function getPatientAppointments() {
  const { userId } = await auth();

  if (!userId) {
    throw new Error("Unauthorized");
  }

  try {
    await connectDB();
    const user = await User.findOne({
      clerkUserId: userId,
      role: "PATIENT",
    }).select("_id");

    if (!user) {
      throw new Error("Patient not found");
    }

    const appointments = await Appointment.find({
      patient: user._id,
    })
      .populate({
        path: "doctor",
        select: "_id name specialty imageUrl",
      })
      .sort({ startTime: "asc" })
      .lean();

    return {
      appointments: appointments.map((appointment) => ({
        ...appointment,
        _id: appointment._id.toString(),
        patient: appointment.patient?.toString?.() ?? null,
        doctor: {
          ...appointment.doctor,
          _id: appointment.doctor?._id?.toString?.() ?? null,
        },
      })),
    };
  } catch (error) {
    console.error("Failed to get patient appointments:", error);
    return { error: "Failed to fetch appointments" };
  }
}
