import mongoose from "mongoose";

const availabilitySchema = new mongoose.Schema(
  {
    doctor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    startTime: { type: Date, required: true },
    endTime: { type: Date, required: true },
    status: {
      type: String,
      enum: ["AVAILABLE", "BOOKED", "BLOCKED"],
      default: "AVAILABLE",
    },
  },
  { timestamps: true }
);

availabilitySchema.index({ doctor: 1, startTime: 1 });

export default mongoose.models.Availability ||
  mongoose.model("Availability", availabilitySchema);
