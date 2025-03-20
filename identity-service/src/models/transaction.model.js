import mongoose from "mongoose";

const transactionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    name: { type: String, required: true },
    type: {
      type: String,
      enum: ["transfer", "airtime", "data", "others"],
      required: true,
    },
    amount: { type: Number, required: true },
    currency: {
      type: String,
      enum: ["naira", "dollar", "pounds", "others"],
      required: true,
    },
    status: {
      type: String,
      enum: ["success", "declined", "processing", "failed"],
      default: "processing",
    },
    time: { type: String, required: true }, // e.g., "Wed 00:00pm"
    display_image: { type: String }, // URL or path to image
  },
  { timestamps: true }
);

const Transaction = mongoose.model("Transaction", transactionSchema)

export default Transaction;
