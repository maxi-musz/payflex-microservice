import express from "express";
import { getSingleTransaction, getTransactionHistory } from "../controllers/trans-histories.ctrl.js";
import { validateToken } from "../middlewares/authMiddleware.js";

const router = express.Router()

router
.route("/get-transaction-histories")
.get(validateToken, getTransactionHistory)

router
.route('/:transactionId')
.get(getSingleTransaction);

export default router