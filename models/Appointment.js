import mongoose from "mongoose";

const appointmentSchema = new mongoose.Schema(
  {
    patient: {
      type: mongoose.Schema.Types.ObjectId, // Standard Mongoose reference
      ref: "User",
      required: true,
    },
    doctor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    startTime: { type: Date, required: true },
    endTime: { type: Date, required: true },
    status: {
      type: String,
      enum: ["SCHEDULED", "COMPLETED", "CANCELLED"],
      default: "SCHEDULED",
    },
    notes: String,
    patientDescription: String,
    videoSessionId: String,
    videoSessionToken: String,
  },
  {
    timestamps: true,
  }
);

// Index to quickly find appointments for a doctor
appointmentSchema.index({ doctor: 1, startTime: 1 });

appointmentSchema.index({ status: 1, startTime: 1 });

export default mongoose.models.Appointment ||
  mongoose.model("Appointment", appointmentSchema);
