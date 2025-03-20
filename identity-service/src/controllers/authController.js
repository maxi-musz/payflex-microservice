
import { getEnv } from "../common/utils/get-env.js";
import asyncHandler from "../middlewares/asyncHandler.js";
import {loginUserService, refreshAccessTokenService, registerUserService, requestVerificationCode, resetPasswordService, verifyEmailCode} from "../services/auth-service.js";
import jwt from "jsonwebtoken";

import colors from "colors";
import { verificationEmailSchema } from "../common/validators/auth.validator.js";
import User from "../models/user.model.js";
import VerificationCode from "../models/verificationCode.model.js";

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
export const register = asyncHandler(async (req, res) => {
  console.log(colors.yellow("📌 Registering a new user"));

  // Call service function (req.body is already validated)
  const newUser = await registerUserService(res, req.body);

  if (!newUser.success) {
    return res.status(400).json(newUser);
  }

  const formattedUser = {
    id: newUser._id,
    name: newUser.name,
    email: newUser.email,
    role: newUser.role, // Now should be correctly returned
  };

  res.status(201).json({
    success: true,
    message: "User registered successfully",
    data: newUser.data,
  });
});

// @desc    login user
// @route   POST /api/auth/login
// @access  Public
export const login = asyncHandler(async (req, res) => {
  console.log(colors.yellow("🔑 User login endpoint called"));

  // Call service function (req.body is already validated)
  const userLogin = await loginUserService(req, res, req.body);

  if (!userLogin.success) {
    return res.status(400).json(userLogin);
  }

  console.log(colors.magenta("User successfully logged in"))
  res.status(200).json({
    success: true,
    message: "Login successful",
    data: userLogin.data,
    accessToken: userLogin.accessToken,
  });
});

// @desc    Refresh Token
// @route   POST /api/auth/refresh-token
// @access  Public
export const refreshAccessToken = async (req, res) => {
  const refreshToken = req.cookies.refreshToken;

  const result = await refreshAccessTokenService(refreshToken);

  if (!result.success) {
    return res.status(result.status).json({ message: result.message });
  }

  // Update refresh token in cookies
  res.cookie("refreshToken", result.newRefreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV !== "development",
    sameSite: "none",
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });

  // console.log(colors.blue("New Access and Refresh tokens successfully generated"));

  res.status(200).json({
    success: true,
    message: "New tokens successfully generated",
    data: {
      accessToken: result.accessToken,
    },
  });
};

// @desc    Request verification code
// @route   POST /api/auth/verify-email/request-code
// @access  Public
export const requestEmailVerification = asyncHandler(async (req, res, next) => {
  console.log(colors.cyan("Requesting email verification code"));
  
  try {
    // const userId = req.user.id;
    const { email } = req.body;

    const result = await requestVerificationCode(email);

    if(!result.success) {
      console.log("Error sending verirfction code")
      res.status(500).json({
        success: result.success,
        message: result.message
      })
    }

    res.status(200).json({ 
      success: true, 
      message: "Verification code sent"
     });
  } catch (error) {
    next(error); // Pass error to the global error handler
  }
});

// 
// 
// 
export const verifyEmail = asyncHandler(async (req, res) => {
  console.log(colors.cyan("Verifying email"))

  const { code, email } = req.body;

  try {

    const result = await verifyEmailCode(email, code);

    if (!result.success) {
      console.log(colors.red("Error verifying email: ", result.message))
      return res.status(400).json({
        success: result.success,
        message: result.message
      });
    }

    res.json(result);
  } catch (error) {
    throw error
  }
});

// 
// 
export const resetPassword = asyncHandler(async (req, res, next) => {
  console.log(colors.cyan("🔄 User reset password endpoint"));

  try {
    const { email, new_password } = req.body;

    const result = await resetPasswordService(email, new_password);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: result.message,
      });
    }

    return res.status(200).json({
      success: true,
      message: "Password reset successfully",
    });
  } catch (error) {
    console.error(colors.red("❌ Error resetting password:"), error.message);
    next(error);
  }
});
