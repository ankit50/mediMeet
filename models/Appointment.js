// models/appointment.model.js
import mongoose from "mongoose";

const appointmentSchema = new mongoose.Schema(
  {
    patient: {
      type: Schema.Types.ObjectId, // Standard Mongoose reference
      ref: "User",
      required: true,
    },
    doctor: {
      type: Schema.Types.ObjectId,
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
  },
  {
    timestamps: true,
  }
);

// Index to quickly find appointments for a doctor
appointmentSchema.index({ doctor: 1, startTime: 1 });

export default mongoose.model("Appointment", appointmentSchema);
