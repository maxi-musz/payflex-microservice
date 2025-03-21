import mongoose from "mongoose";
import { hashValue, compareValue } from "../common/utils/bcrypt.js";
import bcrypt from "bcryptjs";

const profile_image_schema = new mongoose.Schema({ secure_url: { type: String }, public_id: { type: String } });
const user_address_schema = new mongoose.Schema({ city: { type: String }, state: { type: String }, country: { type: String }, home_address: { type: String } });

const userSchema = new mongoose.Schema(
  {
    first_name: { type: String, required: true },
    last_name: { type: String, required: true },
    email: { type: String, unique: true, required: true },
    phone_number: { type: String, required: true },
    password: { type: String, required: true },
    refresh_token: {type: String},
    role: { type: String, enum: ["user", "admin", "super-admin"], default: "user" },
    gender: { type: String, enum: ["male", "female"], required: true },
    date_of_birth: { type: Date, required: [true, "Date of brith must be provided"] },
    profile_image: profile_image_schema,
    address: user_address_schema,
    is_email_verified: { type: Boolean, default: true}
  },
  { timestamps: true }
);

// Convert dateOfBirth before saving
userSchema.pre("save", function (next) {
  if (this.dateOfBirth && typeof this.dateOfBirth === "string") {
    this.dateOfBirth = moment(this.dateOfBirth, "DD-MM-YYYY").toDate(); // Convert to Date object
  }
  next();
});

userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Hash password before saving
userSchema.pre("save", async function (next) {
  if (this.isModified("password")) this.password = await hashValue(this.password);
  next();
});

// Compare password method
userSchema.methods.comparePassword = async function (value) {
  return compareValue(value, this.password);
};

// Remove sensitive data from response
userSchema.set("toJSON", { transform: (doc, ret) => { delete ret.password; delete ret.__v; return ret; } });

const User = mongoose.model("User", userSchema);
export default User;
