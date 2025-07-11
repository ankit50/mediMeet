import mongoose from "mongoose";

const payoutSchema = new mongoose.Schema(
  {
    doctor: {
      type: Schema.Types.ObjectId, // Reference to the doctor
      ref: "User",
      required: true,
    },
    amount: { type: Number, required: true }, // Total payout in USD
    credits: { type: Number, required: true }, // Credits being paid out
    platformFee: { type: Number, required: true },
    netAmount: { type: Number, required: true },
    paypalEmail: { type: String, required: true },
    status: {
      type: String,
      enum: ["PROCESSING", "PROCESSED"],
      default: "PROCESSING",
    },
    processedAt: Date, // When admin marked it as processed
    processedBy: String, // Admin who processed it
  },
  {
    timestamps: true,
  }
);

// Index to quickly find payouts for a doctor
payoutSchema.index({ doctor: 1, status: 1 });
export default mongoose.model("Payout", payoutSchema);
