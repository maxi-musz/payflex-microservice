import mongoose from "mongoose";

const verificationCodeSchema = new mongoose.Schema(
  {
    email: { type: String, required: true},
    code: { type: String, required: true },
    expiresAt: { type: Date, required: true }, // Expiry time
    used: { type: Boolean, default: false },
    is_email_verified: {type: Boolean, default: false }
  },
  { timestamps: true }
);

const VerificationCode = mongoose.model("Verification_Code", verificationCodeSchema);
export default VerificationCode;
