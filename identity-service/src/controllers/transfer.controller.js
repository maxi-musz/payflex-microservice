import asyncHandler from "../middlewares/asyncHandler.js";
import colors from "colors";
import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

const FLUTTERWAVE_BASE_URL = process.env.FLUTTERWAVE_BASE_URL;
const FLW_SECRET_KEY = process.env.FLW_SECRET_KEY;

console.log("Flutterwave base URL:", FLUTTERWAVE_BASE_URL);

// Get all banks
export const getAllBanks = asyncHandler(async (req, res) => {
    console.log(colors.cyan("Getting all banks"));

    const options = {
      method: 'GET',
      url: `${FLUTTERWAVE_BASE_URL}/v3/banks/NG`,
      headers: {
        accept: 'application/json',
        Authorization: `Bearer ${FLW_SECRET_KEY}`,
        'Content-Type': 'application/json'
      }
    };

    try {
      const response = await axios.request(options);
      console.log(colors.magenta("All banks retrieved"));
      return res.status(200).json({
        success: true,
        message: "All banks retrieved",
        banks: response.data.data || []
      });
    } catch (error) {
      console.error(colors.red("❌ Error fetching banks"), error.message);
      res.status(500).json({ success: false, message: "Failed to fetch banks" });
    }
});

// Verify account details
export const verifyAccount = asyncHandler(async (req, res) => {
    console.log(colors.cyan("🔍 Verifying account number..."));

    const { account_number, bank_code } = req.body;
    if (!account_number || !bank_code) {
      return res.status(400).json({ success: false, message: "Account number and bank code are required" });
    }

    try {
      console.log("Verifying acocunt".green)
      const response = await axios.post(
        `${FLUTTERWAVE_BASE_URL}/v3/accounts/resolve`,
        { account_number, bank_code },
        { headers: { Authorization: `Bearer ${FLW_SECRET_KEY}` } }
      );

      console.log("Flutterwave response: ", response)

      if (response.data.status !== "success") {
        return res.status(400).json({ success: false, message: "Invalid account details" });
      }

      res.status(200).json({
        success: true,
        message: "Account verified successfully",
        account_name: response.data.data.account_name,
      });
    } catch (error) {
      console.error(colors.red("❌ Error verifying account"), error.message);
      res.status(500).json({ success: false, message: "Failed to verify account" });
    }
});
