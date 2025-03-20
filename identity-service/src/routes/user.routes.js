import express from "express";
import protect from "../middlewares/authMiddleware.js";
import { getUserDashboard } from "../controllers/user.controller.js";

const userRoutes = express.Router();

userRoutes
.route("/dashboard")
.get(protect, getUserDashboard);

export default userRoutes;
