import asyncHandler from "../middlewares/asyncHandler.js";
import colors from "colors"
import axios from "axios";
import User from "../models/user.model.js";
// import Transaction from "../models/transaction.model.js";

export const getUserDashboard = asyncHandler(async (req, res) => {
    console.log("📌 Fetching user dashboard");

    // try {
    //     const user = req.user;

    //     // Fetch needed user details 
    //     const formattedUser = {
    //         id: user._id,
    //         first_name: user.first_name,
    //         last_name: user.last_name,
    //         email: user.email,
    //         profile_image: user.profile_image?.secure_url || "",
    //     };

    //     // Get the user's transactions from the database 
    //     const transactions = await Transaction.find({ user: user._id }).sort({ createdAt: -1 });

    //     const formattedTransactions = transactions.map((transaction) => ({
    //         id: transaction._id,
    //         name: transaction.name,
    //         type: transaction.type,
    //         amount: transaction.amount,
    //         status: transaction.status,
    //         time: transaction.createdAt.toLocaleString("en-US", { weekday: "short", hour: "2-digit", minute: "2-digit", hour12: true }),
    //         currency: transaction.currency,
    //         display_image: transaction.display_image || "",
    //     }));

    //     console.log(colors.magenta("✅ User dashboard retrieved successfully"));

    //     res.status(200).json({
    //         success: true,
    //         message: "User dashboard data retrieved successfully",
    //         data: {
    //             user: formattedUser,
    //             transactions: formattedTransactions,
    //         },
    //     });

    // } catch (error) {
    //     console.log(colors.red("❌ Error retrieving user dashboard: ", error));
    //     return res.status(500).json({
    //         success: false,
    //         message: "Error retrieving user dashboard",
    //     });
    // }
});

export const getUserDashboardNew = async (req, res) => {
  try {
    const user = req.user;

    // Get user details from DB
    const existingUser = await User
    .findById(user._id)
    .populate("accounts")
    .populate("transactions")

    // Fetch user accounts from banking-service
    const { data: accountData } = await axios.get(
      `${process.env.BANKING_SERVICE_URL}/api/v1/accounts/${user._id}`
    );

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

  