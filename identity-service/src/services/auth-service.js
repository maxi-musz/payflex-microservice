import bcrypt from "bcryptjs";
import User from "../models/user.model.js";
import generateTokens from "../common/utils/generate-token.js";
import db from "../config/db.js";
import colors from "colors";
import moment from "moment";
import redisClient from "../config/redisClient.js";
import jwt from "jsonwebtoken";
import VerificationCode from "../models/verificationCode.model.js";
import {Resend} from "resend";
import crypto from "crypto";
import { sendVerificationEmail } from "../common/helpers/send_email.js";

export const registerUserService = async (res, { 
  first_name, last_name, email, phone_number, address, gender, date_of_birth, password,
 }) => {
  try {

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      console.log(colors.red(`⚠️ User already exists: ${email}`));
      return {
        success: false,
        message: "User already exists with same account",
      };
    }

    const check_verification = await VerificationCode.findOne({ email })
    if(!check_verification || !check_verification.is_email_verified) {
      console.log(colors.red("Email verification failed, retry verification"))
      return {
        success: false,
        message: "Email verification failed, retry verification"
      }
    }

    const formattedDOB = moment(date_of_birth, "DD-MM-YYYY").toDate();

    // Create new user
    const user = await User.create({
      first_name,
      last_name,
      email,
      phone_number,
      address,
      gender,
      date_of_birth: formattedDOB,
      password
    });

    console.log(colors.green(`✅ User registered: ${user.email}`));

    return {
      success: true,
      data: {
        id: user._id,
        first_name: user.first_name,
        last_name: user.last_name,
        email: user.email,
        phone_number: user.phone_number,
        address: user.address,
        gender: user.gender,
        date_of_birth: user.date_of_birth,
        role: user.role,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    };
  } catch (error) {
    console.error(colors.red(`❌ Error in registerUser: ${error.message}`));
    return {
      success: false,
      message: "An error occurred while registering the user",
    };
  }
};

export const loginUserService = async (req, res, { email, password }) => {
  try {
    // Check if user exists
    const user = await User.findOne({ email });
    if (!user) {
      console.log(colors.red(`⚠️ User not found: ${email}`));
      return {
        success: false,
        message: "Invalid email or password",
      };
    }

    // Compare passwords
    const isPasswordCorrect = await user.matchPassword(password);
    // console.log(`Password comparison result: ${isPasswordCorrect}`);
    if (!isPasswordCorrect) {
      console.log(colors.red(`⚠️ Invalid password attempt for: ${email}`));
      return {
        success: false,
        message: "Invalid email or password",
      };
    }

    console.log(colors.green(`✅ User logged in: ${user.email}`));

    // Generate tokens
    const { accessToken, refreshToken } = generateTokens(res, user._id);
    // console.log(colors.green("Generated Tokens:"), { accessToken, refreshToken });
    // console.log(colors.blue(`🔐 Login successful and tokens generated for ${user.email}`));

    // console.log(colors.blue("Refresh Token to Save:"), refreshToken);
    try {
      const save_refresh_token = await User.findByIdAndUpdate(user._id, { refresh_token: refreshToken });
      if(!save_refresh_token) {
        return console.log("Errror saving refresh token")
      }
      console.log(colors.green("✅ Refresh token saved to database"));
    } catch (error) {
      console.log(colors.red("❌ Error saving refresh_token to db"), error);
    }

    await redisClient.setEx(
      `user:${user._id}`,
      3600, // Expiry time in seconds (1 hour)
      JSON.stringify({
        id: user._id,
        first_name: user.first_name,
        last_name: user.last_name,
        email: user.email,
        refresh_token: refreshToken,
        phone_number: user.phone_number,
        address: user.address,
        gender: user.gender,
        date_of_birth: user.date_of_birth,
        role: user.role,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      })
    );

    return {
      success: true,
      message: "Login successful",
      accessToken,
      data: {
        id: user._id,
        first_name: user.first_name,
        last_name: user.last_name,
        email: user.email,
        phone_number: user.phone_number,
        address: user.address,
        gender: user.gender,
        date_of_birth: user.date_of_birth,
        role: user.role,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    };
  } catch (error) {
    console.error(colors.red(`❌ Error in loginUser: ${error.message}`));
    return {
      success: false,
      message: "An error occurred while logging in",
    };
  }
};

export const refreshAccessTokenService = async (refreshToken) => {
  try {
    if (!refreshToken) {
      console.log(colors.red("No refresh token supplied"));
      return { success: false, status: 403, message: "No refresh token" };
    }

    const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET);
    const user = await User.findOne({ refresh_token: refreshToken });

    if (!user) {
      console.log(colors.red("Invalid or expired refresh token"));
      return { success: false, status: 403, message: "Invalid refresh token" };
    }

    // Generate new tokens
    const newAccessToken = jwt.sign({ userId: decoded.userId }, process.env.JWT_SECRET, {
      expiresIn: process.env.USER_ACCESS_TOKEN_EXPIRATION_TIME,
    });

    const newRefreshToken = jwt.sign({ userId: decoded.userId }, process.env.JWT_SECRET, {
      expiresIn: process.env.USER_REFRESH_TOKEN_EXPIRATION_TIME,
    });

    // Save new refresh token to DB
    await User.findByIdAndUpdate(user._id, { refresh_token: newRefreshToken });

    return { success: true, accessToken: newAccessToken, newRefreshToken };
  } catch (error) {
    console.error(`❌ Refresh token error: ${error.message}`);
    return { success: false, status: 500, message: "Internal server error" };
  }
};

// Request email verification code 
export const requestVerificationCode = async (email) => {
  try {
    const resend = new Resend(process.env.RESEND_API_KEY);
    console.log(colors.cyan("🔄 Processing verification request..."));

    // Check if user exists
    const existingUser = await User.findOne({ email });

    // if (existingUser) {
    //   console.log(colors.red("User already exists"));
    //   throw new Error("User already exists");
    // }

    await VerificationCode.deleteMany({ email, expiresAt: { $lt: new Date() } });

    // Check if an unused code exists and is still valid
    const existingCode = await VerificationCode.findOne({ email, used: false });

    if (existingCode && new Date() < existingCode.expiresAt) {
      console.log(colors.green(`✅ Reusing existing code: ${existingCode.code}`));
      await sendVerificationEmail(resend, email, existingCode.code);
      return { success: true, message: "Verification code sent successfully" };
    }

    // Generate a new 4-digit code
    const verificationCode = crypto.randomInt(1000, 9999).toString();
    console.log(colors.yellow(`🔢 Generated new code: ${verificationCode}`));

    // Save the new code in the database
    await VerificationCode.create({
      email,
      code: verificationCode,
      expiresAt: new Date(Date.now() + 5 * 60 * 1000), // 5 minutes expiry
    });

    console.log(colors.magenta("✅ New verification code saved to DB"));

    // Send new verification email
    await sendVerificationEmail(resend, email, verificationCode);

    return { success: true, message: "New verification code sent successfully" };
  } catch (error) {
    console.error(colors.red("❌ Error requesting verification code:"), error.message);
    throw error;
  }
};

// Verify Email code
// 
export const verifyEmailCode = async (email, code) => {
  try {
    const existingCode = await VerificationCode.findOne({ email, code });

    if (!existingCode || new Date() > existingCode.expiresAt) {
      return { success: false, message: "Invalid or expired code" };
    }

    // Update the user's email verification status
    await VerificationCode.findOneAndUpdate(
      { email },
      { is_email_verified: true }
    );

    // Remove the verification code from the database after successful verification
    // await VerificationCode.deleteOne({ email, code });

    console.log(colors.magenta("Email address successfully verified"))
    return { success: true, message: "Email verified successfully" };
  } catch (error) {
    console.error("Error verifying email:", error);
    throw new Error("Email verification failed.");
  }
};

export const resetPasswordService = async (email, new_password) => {
  try {
    console.log(colors.blue(`🔍 Searching for user with email: ${email}`));

    const user = await User.findOne({ email });

    if (!user) {
      console.log(colors.red("❌ User not found"));
      return { success: false, message: "User not found" };
    }

    // Just assign the new password (it will be hashed by the pre-save hook)
    user.password = new_password;
    await user.save();

    console.log(colors.green("✅ Password reset successfully"));

    return { success: true, message: "Password reset successfully" };
  } catch (error) {
    console.error(colors.red("❌ Error in resetPasswordService:"), error.message);
    throw new Error("Failed to reset password.");
  }
};