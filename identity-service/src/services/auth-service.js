import User from "../models/user.model.js";
import generateTokens from "../common/utils/generate-token.js";
import colors from "colors";
import moment from "moment";
import redisClient from "../config/redisClient.js";
import jwt from "jsonwebtoken";
import VerificationCode from "../models/verificationCode.model.js";
import crypto from "crypto";
import { sendOTPByEmail, sendWelcomeEmail } from "../mailers/send-emails.js";
import RefreshToken from "../models/refreshToken.model.js";
import logger from "../common/utils/logger.js";

// Request email verification code 
export const requestVerificationCode = async (email) => {
  try {
    console.log(colors.cyan("🔄 Processing verification request..."));

    // Check if user exists
    const existingUser = await User.findOne({ email });

    if (existingUser) {
      console.log(colors.red("User already exists"));
      throw new Error("User already exists");
    }

    await VerificationCode.deleteMany({ email, expiresAt: { $lt: new Date() } });

    // Check if an unused code exists and is still valid
    const existingCode = await VerificationCode.findOne({ email });

    if(existingCode) {
      console.log(colors.red("Deleting existing OTP from db"))
      await existingCode.deleteOne()
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

     // send code with google
     await sendOTPByEmail(email, verificationCode);

    return { success: true, message: "New verification code sent successfully" };
  } catch (error) {
    console.error(colors.red("❌ Error requesting verification code:"), error.message);
    throw error;
  }
};

// Verify Email code
export const verifyEmailCode = async (email, code) => {
  try {
    const existingCode = await VerificationCode.findOne({ email, code });

    if (!existingCode || new Date() > existingCode.expiresAt) {
      return { success: false, message: "Invalid or expired code" };
    }

    await VerificationCode.findOneAndUpdate(
      { email },
      { $set: { is_email_verified: true } }, // Use $set to explicitly set the field
      { new: true, runValidators: true }
    );

    console.log(colors.magenta("Email address successfully verified"))
    return { success: true, message: "Email verified successfully" };
  } catch (error) {
    console.error("Error verifying email:", error);
    throw new Error("Email verification failed.");
  }
};

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

    await VerificationCode.findOneAndDelete(email)

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
      return { success: false, message: "Invalid email or password" };
    }

    // Compare passwords
    const isPasswordCorrect = await user.matchPassword(password);
    if (!isPasswordCorrect) {
      console.log(colors.red(`⚠️ Invalid password attempt for: ${email}`));
      return { success: false, message: "Invalid email or password" };
    }

    console.log(colors.green(`✅ User logged in: ${user.email}`));

    // Generate tokens
    const { accessToken, refreshToken } = generateTokens(res, user._id);

    try {
      // Delete any existing refresh token for the user (optional, for security)
      await RefreshToken.deleteOne({ user: user._id });

      // Save new refresh token
      const expirationTime = Number(process.env.USER_REFRESH_TOKEN_EXPIRATION_TIME) || 86400; // Default to 1 day

      const newRefreshToken = new RefreshToken({
        token: refreshToken,
        user: user._id,
        expiresAt: new Date(Date.now() + expirationTime * 1000), // Convert to ms
      });

      await newRefreshToken.save();
      console.log(colors.green("✅ Refresh token saved to database"));
    } catch (error) {
      console.log(colors.red("❌ Error saving refresh token to DB"), error);
    }

    // Store user details in Redis (without refresh token)
    await redisClient.setEx(
      `user:${user._id}`,
      3600, // Expiry time in seconds (1 hour)
      JSON.stringify({
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
      })
    );

    return {
      success: true,
      message: "Login successful",
      accessToken,
      refreshToken,
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
    return { success: false, message: "An error occurred while logging in" };
  }
};

export const refreshAccessTokenService = async (refreshToken, res) => {
  try {
    if (!refreshToken) {
      logger.warn(colors.red("No refresh token supplied"));
      return { success: false, status: 403, message: "No refresh token" };
    }

    // Find refresh token in the database
    const storedToken = await RefreshToken.findOne({ token: refreshToken }).populate("user");

    if (!storedToken || !storedToken.user) {
      logger.warn(colors.red("Invalid or expired refresh token"));
      return { success: false, status: 403, message: "Invalid refresh token" };
    } 

    // Generate new tokens (without `res`)
    const { accessToken, refreshToken: newRefreshToken } = generateTokens(res, storedToken.user._id);
    
    // Replace old refresh token with the new one
    await RefreshToken.deleteOne({ token: refreshToken });

    const newRefreshTokenDoc = new RefreshToken({
      token: newRefreshToken,
      user: storedToken.user._id,
      expiresAt: new Date(Date.now() + process.env.USER_REFRESH_TOKEN_EXPIRATION_TIME * 1000),
    });

    await newRefreshTokenDoc.save();

    logger.info(colors.green("✅ Access token refreshed successfully"));

    return { 
      success: true, 
      message: "Access token refreshed successfully", 
      accessToken
    };
  } catch (error) {
    logger.warn(colors.red(`❌ Refresh token error: ${error.message}`));
    return { success: false, status: 500, message: "Internal server error" };
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

    user.password = new_password;
    await user.save();

    console.log(colors.green("✅ Password reset successfully"));

    return { success: true, message: "Password reset successfully" };
  } catch (error) {
    console.error(colors.red("❌ Error in resetPasswordService:"), error.message);
    throw new Error("Failed to reset password.");
  }
};