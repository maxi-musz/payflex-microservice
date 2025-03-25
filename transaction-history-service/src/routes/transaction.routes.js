import express from "express";
import { getSingleTransaction, getTransactionHistory } from "../controllers/trans-histories.ctrl.js";
import protect from "../middlewares/authMiddleware.js";

const router = express.Router()

router
.route("/get-transaction-histories")
.get(protect, getTransactionHistory)

router
.route('/:transactionId')
.get(protect, getSingleTransaction);

export default router