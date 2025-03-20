import express from "express";
import validateRequest from "../middlewares/validateRequest.js";
import { login, refreshAccessToken, register, requestEmailVerification, resetPassword, verifyEmail } from "../controllers/authController.js";
import {
    registerSchema,
    loginSchema,
    requestEmailOTPSchema,
    verifyOTPSchema,
    updatePasswordSchema
} from "../models/validationSchema.js"
import protect from "../middlewares/authMiddleware.js";
import { getUserDashboard } from "../controllers/user.controller.js";

const authRoute = express.Router();

authRoute
.route("/register")
.post(validateRequest(registerSchema), register);

authRoute
.route("/login")
.post(validateRequest(loginSchema), login);

authRoute 
.route("/refresh-token")
.post(refreshAccessToken)

authRoute
.route("/request-code")
.post(validateRequest(requestEmailOTPSchema),requestEmailVerification)

authRoute
.route("/verify-email")
.post(validateRequest(verifyOTPSchema), verifyEmail)

authRoute
.route("/password-reset-otp")
.post(validateRequest(requestEmailOTPSchema), requestEmailVerification)

authRoute
.route("/verify-password-reset-otp")
.post(validateRequest(requestEmailOTPSchema), verifyEmail)

authRoute
.route("/update-password")
.post(validateRequest(updatePasswordSchema), resetPassword)



export default authRoute;
