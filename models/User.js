import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
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
  },
  {
    // Mongoose automatically adds and manages `createdAt` and `updatedAt`
    timestamps: true,
  }
);
// Virtual relations
userSchema.virtual("patientAppointments", {
  ref: "Appointment",
  localField: "_id",
  foreignField: "patient",
});

userSchema.virtual("doctorAppointments", {
  ref: "Appointment",
  localField: "_id",
  foreignField: "doctor",
});

userSchema.virtual("availabilities", {
  ref: "Availability",
  localField: "_id",
  foreignField: "doctor",
});

userSchema.virtual("transactions", {
  ref: "CreditTransaction",
  localField: "_id",
  foreignField: "user",
});

userSchema.virtual("payouts", {
  ref: "Payout",
  localField: "_id",
  foreignField: "doctor",
});

userSchema.set("toObject", { virtuals: true });
userSchema.set("toJSON", { virtuals: true });

export default mongoose.models.User || mongoose.model("User", userSchema);
