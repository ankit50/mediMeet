import mongoose from "mongoose";

const creditTransactionSchema = new mongoose.Schema(
  {
    user: {
      type: Schema.Types.ObjectId, // Reference to the user
      ref: "User",
      required: true,
      index: true,
    },
    amount: {
      // Positive for additions, negative for deductions
      type: Number,
      required: true,
    },
    type: {
      type: String,
      enum: ["CREDIT_PURCHASE", "APPOINTMENT_DEDUCTION", "ADMIN_ADJUSTMENT"],
      required: true,
    },
    packageId: String, // Optional reference to a purchase package
  },
  {
    timestamps: { createdAt: true, updatedAt: false }, // Only need createdAt
  }
);

export default mongoose.model("CreditTransaction", creditTransactionSchema);
