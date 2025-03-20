import mongoose from "mongoose";

const transactionHistorySchema = new mongoose.Schema({
    amount: { type: Number, required: true },
    type: { type: String, enum: ["credit", "debit"], required: true }, // Credit/Debit
    description: { type: String }, // Transaction description
    status: { type: String, enum: ["success", "pending", "failed"], required: true },
    timestamp: { type: Date, default: Date.now }, // Date & time of transaction
  });
  
const linkedBankSchema = new mongoose.Schema({
    bank_name: { type: String, required: true },
    account_number: { type: String, required: true },
    bank_balance: { type: Number, default: 0 },
    account_name: { type: String, required: true },
    bank_code: { type: String, required: true }, // Useful for API transactions
    linked_at: { type: Date, default: Date.now },
    transaction_history: [transactionHistorySchema], // Store external bank transactions properly
});

const walletSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    total_linked_banks: { type: Number, default: 0 },
    total_wallet_balance: { type: Number, default: 0 },
    linked_banks: [linkedBankSchema], // Array of linked banks
  },
  { timestamps: true }
);

export default mongoose.model("Wallet", walletSchema);
