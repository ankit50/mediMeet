import { currentUser } from "@clerk/nextjs/server";
import { connectDB } from "./dbConnect";
import User from "@/models/User";

export const checkUser = async () => {
  const user = await currentUser();
  if (!user) {
    console.log("No user");
    return null;
  }
  try {
    await connectDB();
    const loggedUser = await User.findOne(user.email);
    console.log(loggedUser);
    console.log(user);
    const newDoctor = new User({
      clerkUserId: "user_123456789",
      email: "doctor@example.com",
      name: "Dr. John Doe",
      imageUrl: "https://example.com/avatar.jpg",
      role: "DOCTOR",
      specialty: "Cardiology",
      experience: 8,
      credentialUrl: "https://example.com/certificate.pdf",
      description:
        "Experienced cardiologist with over 8 years in clinical practice.",
      verificationStatus: "VERIFIED",
      availabilities: [
        {
          startTime: new Date("2025-07-12T10:00:00Z"),
          endTime: new Date("2025-07-12T11:00:00Z"),
          status: "AVAILABLE",
        },
        {
          startTime: new Date("2025-07-12T11:00:00Z"),
          endTime: new Date("2025-07-12T12:00:00Z"),
          status: "BOOKED",
        },
      ],
    });

    await newDoctor.save();
  } catch (error) {
    console.log(error.message);
  }
};
