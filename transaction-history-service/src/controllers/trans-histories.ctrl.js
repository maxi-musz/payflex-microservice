import logger from "../common/utils/logger.js";
import prisma from "../config/prismaClient.js";
import asyncHandler from "../middlewares/asyncHandler.js";
import colors from "colors"
import jwt from "jsonwebtoken";

export const getTransactionHistory = asyncHandler(async (req, res) => {
    console.log(colors.cyan("🔹 Fetching user transaction history"));
  
    try {
      let token = req.headers.authorization?.split(" ")[1];
  
      if (!token) {
        return res.status(401).json({ success: false, message: "Not authorized, no token" });
      }
  
      // ✅ Extract user ID from the token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      if (!decoded.userId) {
        return res.status(401).json({ success: false, message: "Invalid token" });
      }
  
      const userId = decoded.userId;
  
      const transactionHistories = await prisma.transactionHistory.findMany({
        where: { user_id: userId },
        include: {
          icon: true,  
          sender_details: true  
        },
        orderBy: { createdAt: 'desc' }
      });
  
      if (!transactionHistories || transactionHistories.length < 1) {
        console.log(colors.magenta("No available transaction at the moment"))
        return res.status(200).json({
          success: true,
          message: "No transaction histories at the moment",
          data: [],
        });
      }
  
      console.log(colors.magenta(`Total of ${transactionHistories.length} transaction histories retrieved`))
      return res.status(200).json({
        success: true,
        message: `Total of ${transactionHistories.length} Transaction histories retrieved`,
        total: transactionHistories.length,
        data: transactionHistories
      });
  
    } catch (error) {
      console.error(colors.red("Error retrieving user transactions:", error.message));
      return res.status(500).json({
        success: false,
        message: "Error retrieving user transaction histories",
      });
    }
});

export const getSingleTransaction = asyncHandler(async(req, res) => {
    logger.info(colors.cyan("Getting single transaction by ID"))

    try {
        const user = req.user;
        const { transactionId } = req.params;

        if(!user) {
            logger.error("User does not exist")
            return res.status(400).json({
                success: false,
                message: "User not found"
            })
        }

        if(!transactionId) {
            logger.error("Transaction ID is required")
            return res.status(400).json({
                success: false,
                message: "Transaction ID is required"
            })
        }

        const transaction = await prisma.transactionHistory.findUnique({
            where: { 
                id: transactionId,
                //user_id: user.id // Ensure the transaction belongs to the user
            },
            include: {
                icon: true,
                sender_details: true
            }
        });

        if(!transaction) {
            logger.info(colors.magenta("Transaction not found"))
            return res.status(404).json({
                success: false,
                message: "Transaction not found"
            })
        }

        logger.info(colors.magenta(`Transaction with ID ${transactionId} retrieved`))
        return res.status(200).json({
            success: true,
            message: "Transaction retrieved successfully",
            data: transaction
        })

    } catch (error) {
        logger.error(colors.red("Error retrieving transaction", error))
        return res.status(500).json({
            success: false,
            message: "Error retrieving transaction"
        })
    }
})