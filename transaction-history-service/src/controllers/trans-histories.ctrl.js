import logger from "../common/utils/logger.js";
import prisma from "../config/prismaClient.js";
import asyncHandler from "../middlewares/asyncHandler.js";
import colors from "colors"

export const getTransactionHistory = asyncHandler(async(req, res) => {
    logger.info(colors.cyan("getting user transaction history"))

    try {
        const user = req.user

        if(!user) {
            logger.error("User does not exist")
            return res.status(400).json({
                success: false,
                message: "User not found"
            })
        }

        console.log(colors.yellow("User Id: ", user.id))

        const transactionHistories = await prisma.transactionHistory.findMany({
            where: { user_id: user.id },
            include: {
              icon: true, 
              sender_details: true  
            }
        });
        

        if(!transactionHistories || transactionHistories.length < 1) {
            logger.info(colors.magenta("No transaction history available at the moment"))

            return res.status(200).json({
                success: true,
                message: "No transaction histories at the moment"
            })
        }

        logger.info(colors.magenta(`Total of ${transactionHistories.length} transactions retrieved`))
        return res.status(200).json({
            success: true,
            message: `Transaction histories retrieved`,
            total: transactionHistories.length,
            data: transactionHistories
        })

    } catch (error) {
        logger.error(colors.red("Error retrieving user transactions", error))
        return res.status(500).json({
            success: false,
            message: "Error retrieving user transaction histories at the moment"
        })
    }
})

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