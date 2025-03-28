import asyncHandler from "../middlewares/asyncHandler.js";
import colors from "colors"
import axios from "axios";
import User from "../models/user.model.js";
import logger from "../common/utils/logger.js";
import prisma from "../config/prismaClient.js";
import dotenv from "dotenv";

dotenv.config();

// get currently signed in user
// GET
// Protected
export const getCurrentUser = asyncHandler(async (req, res) => {
  console.log(colors.cyan("📌 Getting currently signed-in user"));

  const user = req.user;

  try {
    const existingUser = await prisma.user.findUnique({
      where: { id: user.id },
      // select: { id: true, email: true, name: true }
    });

    if (!existingUser) {
      logger.warn(colors.yellow("⚠️ User not found"));
      return res.status(404).json({ success: false, message: "User not found" });
    }

    logger.info(colors.magenta("✅ User successfully retrieved"));
    return res.status(200).json({
      success: true,
      message: "User successfully retrieved",
      data: existingUser,
    });
  } catch (error) {
    logger.error(colors.red("❌ Error fetching user details:", error.message));
    return res.status(500).json({
      success: false,
      message: "Error fetching user details",
    });
  }
});

export const getUserDashboard = asyncHandler(async (req, res) => {
  console.log("📌 Fetching user dashboard");

  try {
    const user = req.user;

    const getTransactionHistories = `${process.env.TRANSACTION_SERVICE_URL}/${process.env.API_VERSION}/history/get-transaction-histories`;
    let response;

    // ✅ Fetch transactions, forwarding user token
    try {
      console.log("User Id: ", user.id)
      response = await axios.get(getTransactionHistories, {
        headers: { Authorization: `Bearer ${req.token}` }, // Forward token
        "x-user-id": req.user.id,
      });
    } catch (error) {
      if(error.status === 401) {
        console.error(colors.red("Error fetching transaction history: user must be signed in"));
        return res.status(500).json({ success: false, message: "Error fetching transaction history: user must be signed in" });
      } else {
        console.error(colors.red("Error fetching transaction history: ", error.message));
        return res.status(500).json({ success: false, message: "Error fetching transaction history: user must be signed in" });
      }
    }

    if (!response.data || response.data.data.length < 1) {
      return res.status(200).json({
        success: true,
        message: "You have no transaction history at the moment",
        data: [],
      });
    }

    console.log(colors.magenta('User dashboard successsfully retrieved'))
    return res.status(200).json({
      success: true,
      message: 'User dashboard successsfully retrieved',
      data: {
        transaction_history: response.data
      },
    });

  } catch (error) {
    console.error("Error fetching user dashboard:", error.message);
    return res.status(500).json({ success: false, message: "Server error" });
  }
});