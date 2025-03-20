import express from "express";
import { getAllBanks, verifyAccount } from "../controllers/transfer.controller.js";
import protect from "../middlewares/authMiddleware.js"

const transferRoutes = express.Router()

transferRoutes
.route("/get-all-banks")
.get(getAllBanks)

transferRoutes
.route("/verify-account")
.post(protect, verifyAccount)

export default transferRoutes;