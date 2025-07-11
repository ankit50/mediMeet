import mongoose from "mongoose";

// This is a sub-document schema. It does NOT get its own model.
// It will be embedded directly into the User document for doctors.
const availabilitySchema = new mongoose.Schema(
  {
    startTime: { type: Date, required: true },
    endTime: { type: Date, required: true },
    status: {
      type: String,
      enum: ["AVAILABLE", "BOOKED", "BLOCKED"],
      default: "AVAILABLE",
    },
  },
  { _id: false }
); // _id is not needed for embedded sub-documents.

const userSchema = new Schema(
  {
    clerkUserId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    name: String,
    imageUrl: String,
    role: {
      type: String,
      enum: ["UNASSIGNED", "PATIENT", "DOCTOR", "ADMIN"],
      default: "UNASSIGNED",
    },

    // Patient-specific fields
    credits: {
      type: Number,
      default: 2,
    },

    // Doctor-specific fields
    specialty: String,
    experience: Number, // Years of experience
    credentialUrl: String,
    description: String,
    verificationStatus: {
      type: String,
      enum: ["PENDING", "VERIFIED", "REJECTED"],
      default: "PENDING",
    },
    // ✨ EMBEDDED DATA: A doctor's availability is part of their profile.
    availabilities: [availabilitySchema],
  },
  {
    // Mongoose automatically adds and manages `createdAt` and `updatedAt`
    timestamps: true,
  }
);
export default mongoose.model("User", userSchema);
