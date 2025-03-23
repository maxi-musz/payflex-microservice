import logger from "../common/utils/logger.js";
import asyncHandler from "../middlewares/asyncHandler.js";
import colors from "colors"
import Accounts from "../models/accounts.js";

export const getAllAccounts = asyncHandler(async (req, res) => {
    logger.info(colors.cyan("📌 Fetching user accounts..."));

    try {
        const userId = req.user?._id;
        if (!userId) {
            logger.warn(colors.yellow("⚠️ User ID not found in request"));
            return res.status(400).json({ message: "User ID is required" });
        }

        const accounts = await Accounts.find({ user: userId });

        if (!accounts.length) {
            logger.info(colors.blue("🔍 No accounts found for user"));
            return res.json({ accounts: [] });
        }

        logger.info(colors.green(`✅ Found ${accounts.length} account(s) for user`));
        res.json({ accounts });

    } catch (error) {
        logger.error(colors.red(`❌ Error fetching accounts: ${error.message}`));
        res.status(500).json({ message: "Internal server error", error: error.message });
    }
});