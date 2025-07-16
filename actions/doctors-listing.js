import { connectDB } from "@/lib/dbConnect";
import User from "@/models/User";

export async function getDoctorsBySpecialty(specialty) {
  try {
    await connectDB();
    const doctors = await User.find({
      role: "DOCTOR",
      verificationStatus: "VERIFIED",
      specialty: specialty.split("%20").join(" "),
    }).sort({ name: 1 });
    return { doctors };
  } catch (error) {
    console.error("Failed to fetch doctors by Specialty:", error.message);
    return { error: "Failed to fetch doctors" };
  }
}
