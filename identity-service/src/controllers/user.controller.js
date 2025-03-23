import asyncHandler from "../middlewares/asyncHandler.js";
import colors from "colors"
import axios from "axios";
import User from "../models/user.model.js";
import logger from "../common/utils/logger.js";
// import Transaction from "../models/transaction.model.js";

export const getUserDashboard = asyncHandler(async (req, res) => {
    console.log("📌 Fetching user dashboard");

    try {
        const user = req.user;

        // Fetch needed user details 
        const formattedUser = {
            id: user._id,
            first_name: user.first_name,
            last_name: user.last_name,
            email: user.email,
            profile_image: user.profile_image?.secure_url || "",
        };

        try {
          const bankingServiceUrl = `${process.env.API_GATEWAY_URL}/api/v1/banking/accounts`
          console.log(colors.red("banking service url: ", bankingServiceUrl))

          // Fetch user accounts from banking-service
          const response = await axios.get(
            bankingServiceUrl
          );

        } catch (error) {
          logger.warn(colors.red("Error fetching account details: ", error))
          return res.status(500).json({
            success: false, 
            message: "Error fetching user account details"
          })
        }
        

        logger.info(colors.magenta(`✅ Dashboard for user ${user.email} retrieved successfully`));

        res.status(200).json({
            success: true,
            message: "User dashboard data retrieved successfully",
            data: {
                user: formattedUser,
                // transactions: formattedTransactions,
            },
        });

    } catch (error) {
        console.log(colors.red("❌ Error retrieving user dashboard: ", error));
        return res.status(500).json({
            success: false,
            message: "Error retrieving user dashboard",
        });
    }
});

export const getUserDashboardNew = async (req, res) => {
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
};

  