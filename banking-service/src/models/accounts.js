import mongoose from "mongoose";

const accountSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  accountNumber: { type: String, required: true, unique: true },
  accountType: { type: String, enum: ["NGN", "USD", "GBP", "EUR"], required: true }, // More currencies if needed
  bankName: { type: String, required: true },
  bankCode: { type: String }, // Useful for local banks (e.g., Nigeria)
  balance: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now }
});

const Accounts = mongoose.model("Accounts", accountSchema)

export default Accounts;
