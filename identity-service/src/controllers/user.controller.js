import asyncHandler from "../middlewares/asyncHandler.js";
import colors from "colors"
import axios from "axios";
import User from "../models/user.model.js";
import logger from "../common/utils/logger.js";
import prisma from "../config/prismaClient.js";

// get currently signed in user
// GET
// Protected
export const getCurrentUser = asyncHandler(async(req, res) => {
  console.log(colors.cyan("Getting currently signed in user"))

  const userId = req.params.id
  console.log("User id from param: ", userId)

  try {
    const user = await prisma.user.findUnique({
      where: { id: req.params.id }
    });

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    logger.info(colors.magenta("User successfully retrieved"))
    return res.status(200).json({ 
      success: true,
      message: "User successfully retrieved",
      data: user
     });
  } catch (error) {
    logger.error("Error fetching user details", error)
    res.status(500).json({ success: false, message: "Error fetching user details" });
  }
})

export const getUserDashboard = asyncHandler(async (req, res) => {
    console.log("📌 Fetching user dashboard");

    try {
      const user = req.user;
      
      // Fetch user transactions
  
      // If no account exists, create one
      let accounts = accountData.accounts;
      if (accounts.length === 0) {
        const { data: newAccount } = await axios.post( 
          `${process.env.BANKING_SERVICE_URL}/accounts/create`,
          { userId }
        );
        accounts = newAccount.accounts;
      }
  
      res.json({
        user,
        accounts,
      });
    } catch (error) {
      console.error("Error fetching user dashboard:", error.message);
      res.status(500).json({ message: "Server error" });
    }
});

export const getUserDashboardNew = async (req, res) => {
  
};

  