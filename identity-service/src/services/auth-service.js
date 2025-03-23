import generateTokens from "../common/utils/generate-token.js";
import colors from "colors";
import moment from "moment";
import bcrypt from "bcryptjs";
import redisClient from "../config/redisClient.js";
import VerificationCode from "../models/verificationCode.model.js";
import crypto from "crypto";
import { sendOTPByEmail, sendWelcomeEmail } from "../mailers/send-emails.js";
import RefreshToken from "../models/refreshToken.model.js";
import logger from "../common/utils/logger.js";
import prisma from "../config/prismaClient.js";

// Request email verification code 
export const requestVerificationCode = async (email) => {
  try {
    const user = await prisma.user.findUnique({ where: { email } });
    // if (user && user.is_email_verified) {
    //   logger.error(colors.red(`User with email: ${email} already verified`));
    //   throw new Error(`User with email: ${email} already exists`);
    // }

    // Create a new user entry with just email and OTP
    const otp = crypto.randomInt(1000, 9999).toString();
    const otpExpiresAt = new Date(Date.now() + 5 * 60 * 1000); //5 mins 

    let userToVerify

    if (!user) {
      // Create a new user entry with just email and OTP
      userToVerify = await prisma.user.create({
        data: {
          email,
          otp,
          otp_expires_at: otpExpiresAt,
        },
      });
    } else {
      // Update OTP for existing user
      userToVerify = await prisma.user.update({
        where: { email },
        data: { otp, otp_expires_at: otpExpiresAt },
      });
    }

    // Send OTP via email
    try {
      await sendOTPByEmail(email, otp);
      logger.info(colors.magenta(`OTP code: ${otp} sent to user: ${email}`));
    } catch (sendError) {
      logger.error(colors.red(`❌ Failed to send OTP to ${email}: ${sendError.message}`));
      throw new Error("Failed to send OTP. Please try again.");
    }

    return { success: true, message: "New verification code sent successfully", data: email };
  } catch (error) {
    console.error(colors.red("❌ Error requesting verification code:"), error.message);
    throw error;
  }
};


// Verify Email code
export const verifyEmailCode = async (email, code) => {
  try {
    const user = await prisma.user.findFirst({ 
      where: { email, otp: code } 
    });

    if (!user || new Date() > new Date(user.otp_expires_at)) {
      return { success: false, message: "Invalid or expired code" };
    }

    // Update `is_email_verified` and clear OTP
    await prisma.user.update({
      where: { email },
      data: { 
        is_email_verified: true, 
        otp: null, 
      }
    });

    console.log(colors.magenta("Email address successfully verified"));
    return { success: true, message: "Email verified successfully" };
  } catch (error) {
    console.error("Error verifying email:", error);
    throw new Error("Email verification failed.");
  }
};

// REGISTER
export const registerUserService = async (res, { 
  first_name, last_name, email, phone_number, address, gender, date_of_birth, password 
}) => {
  try {
    // Check if user exists and is verified
    const existingUser = await prisma.user.findUnique({ where: { email } });
    
    if (!existingUser) {
      console.log(colors.red(`⚠️ Email not registered. Verify your email first.`));
      return { success: false, message: "Email verification required." };
    }

    if (!existingUser.is_email_verified) {
      console.log(colors.red(`⚠️ Email not verified: ${email}`));
      return { success: false, message: "Email verification failed. Retry verification." };
    }

    console.log(colors.cyan("✅ Email verified. Proceeding with registration."));

    // Hash password before saving
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const formattedDOB = moment(date_of_birth, "DD-MM-YYYY").toDate();

    // Create new user
    const user = await prisma.user.update({
      where: { email },
      data: {
        first_name,
        last_name,
        phone_number,
        gender: gender.toUpperCase(),
        date_of_birth: formattedDOB,
        password: hashedPassword, // Store hashed password
        address: {
          upsert: {
            create: {
              country: address.country,
              state: address.state,
              city: address.city,
              home_address: address.home_address
            },
            update: {
              country: address.country,
              state: address.state,
              city: address.city,
              home_address: address.home_address
            }
          }
        },
        is_email_verified: true // Mark email as verified
      },
      include: { address: true } // Include address in response
    });

    console.log(colors.green(`✅ User registered: ${user.email}`));

    return {
      success: true,
      id: user.id,
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
    };
  } catch (error) {
    console.error(colors.red(`❌ Error in registerUser: ${error.message}`));
    return {
      success: false,
      message: "An error occurred while registering the user.",
    };
  }
};

export const loginUserService = async (req, res, { email, password }) => {
  try {
    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { email },
      include: { address: true }, // Include address details
    });

    if (!user) {
      console.log(colors.red(`⚠️ User not found: ${email}`));
      return { success: false, message: "Invalid email or password" };
    }

    // Compare passwords
    const isPasswordCorrect = await bcrypt.compare(password, user.password);
    if (!isPasswordCorrect) {
      console.log(colors.red(`⚠️ Invalid password attempt for: ${email}`));
      return { success: false, message: "Invalid email or password" };
    }

    console.log(colors.green(`✅ User logged in: ${user.email}`));

    // Generate tokens
    const { accessToken, refreshToken } = generateTokens(res, user.id);

    try {
      // Delete any existing refresh token for the user (optional, for security)
      await prisma.refreshToken.deleteMany({
        where: { userId: user.id },
      });

      // Save new refresh token
      const expirationTime =
        Number(process.env.USER_REFRESH_TOKEN_EXPIRATION_TIME) || 86400; // Default to 1 day

      await prisma.refreshToken.create({
        data: {
          token: refreshToken,
          userId: user.id,
          expiresAt: new Date(Date.now() + expirationTime * 1000), // Convert to ms
        },
      });

      console.log(colors.green("✅ Refresh token saved to database"));
    } catch (error) {
      console.log(colors.red("❌ Error saving refresh token to DB"), error);
    }

    // Store user details in Redis (without refresh token)
    await redisClient.setEx(
      `user:${user.id}`,
      3600, // Expiry time in seconds (1 hour)
      JSON.stringify({
        id: user.id,
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
        id: user.id,
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
    const storedToken = await prisma.refreshToken.findFirst({
      where: { token: refreshToken },
      include: { user: true } // Ensure we fetch the user details
    });

    if (!storedToken || !storedToken.user) {
      logger.warn(colors.red("Invalid or expired refresh token"));
      return { success: false, status: 403, message: "Invalid refresh token" };
    }

    // Generate new tokens
    const { accessToken, refreshToken: newRefreshToken } = generateTokens(res, storedToken.user.id);

    // Update the stored refresh token
    await prisma.refreshToken.update({
      where: { id: storedToken.id }, // Use token ID, not email
      data: {
        token: newRefreshToken,
        expiresAt: new Date(Date.now() + Number(process.env.USER_REFRESH_TOKEN_EXPIRATION_TIME) * 1000),
      }
    });

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

    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      console.log(colors.red("❌ User not found"));
      return { success: false, message: "User not found" };
    }

    // Hash new password before saving
    const hashedPassword = await bcrypt.hash(new_password, 10);

    // Update password in database
    await prisma.user.update({
      where: { email },
      data: { password: hashedPassword },
    });

    console.log(colors.green("✅ Password reset successfully"));

    return { success: true, message: "Password reset successfully" };
  } catch (error) {
    console.error(colors.red("❌ Error in resetPasswordService:"), error.message);
    throw new Error("Failed to reset password.");
  }
};
