
import { getEnv } from "../common/utils/get-env.js";
import asyncHandler from "../middlewares/asyncHandler.js";
import {
  loginUserService, 
  refreshAccessTokenService, 
  registerUserService, 
  requestVerificationCode, 
  resetPasswordService, 
  verifyEmailCode
} from "../services/auth-service.js";
import jwt from "jsonwebtoken";

import colors from "colors";
import logger from "../common/utils/logger.js";

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
      res.status(500).json({
        success: result.success,
        message: result.message,
        
      })
    }

    
    res.status(200).json({ 
      success: true, 
      message: "Verification code sent",
      data: result.data
     });
  } catch (error) {
    next(error); // Pass error to the global error handler
  }
});

// // 
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

// // @desc    Register a new user
// // @route   POST /api/auth/register
// // @access  Public
export const register = asyncHandler(async (req, res) => {
  console.log(colors.yellow("📌 Registering a new user"));

  // Call service function (req.body is already validated)
  const newUser = await registerUserService(res, req.body);

  if (!newUser.success) {
    return res.status(400).json(newUser);
  }

  const formattedUser = {
    id: newUser.id,  // Correct field name
    name: `${newUser.first_name} ${newUser.last_name}`, 
    email: newUser.email,
    role: newUser.role,
    address: newUser.address, 
  };

  res.status(201).json({
    success: true,
    message: "User registered successfully",
    data: formattedUser,
  });
});

// // @desc    login user
// // @route   POST /api/auth/login
// // @access  Public
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

export const refreshAccessToken = async (req, res) => {
  try {
    logger.info("Refresh token endpoint hit...");

    const { refreshToken } = req.cookies;
    if (!refreshToken) {
      return res.status(400).json({ success: false, message: "Refresh token missing" });
    }

    const result = await refreshAccessTokenService(refreshToken, res);
    
    return res.status(200).json(result);
  } catch (error) {
    logger.error("Refresh token error occurred", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

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

