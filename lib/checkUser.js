import { currentUser } from "@clerk/nextjs/server";
import { connectDB } from "./dbConnect";
import User from "@/models/User";
import CreditTransaction from "@/models/CreditTransaction";
import mongoose from "mongoose";

export const checkUser = async () => {
  await connectDB();
  const user = await currentUser();
  if (!user) {
    return null;
  }
  try {
    const existingUser = await User.findOne({ clerkUserId: user.id });
    if (existingUser) {
      return existingUser;
    }

    //start DB transaction
    const session = await mongoose.startSession();
    session.startTransaction();

    const [newUser] = await User.create(
      [
        {
          clerkUserId: user.id,
          email: user.emailAddresses[0].emailAddress,
          name: user.firstName + " " + user.lastName,
          imageUrl: user.imageUrl,
          role: "UNASSIGNED", // or "PATIENT" by default
        },
      ],
      { session }
    );

    await CreditTransaction.create(
      [
        {
          user: newUser._id,
          type: "CREDIT_PURCHASE",
          amount: 0,
          packageId: "free_user",
        },
      ],
      { session }
    );
    await session.commitTransaction();
    session.endSession();
    console.log(newUser);
    return newUser;
  } catch (error) {
    console.error("User creation failed:", error);
    return null;
  }
};
