import express from "express";
import protect from "../middlewares/authMiddleware.js";
import { 
    getUserDashboard,
    getCurrentUser
 } from "../controllers/user.controller.js";

const userRoutes = express.Router();

userRoutes
.route("/dashboard")
.get(protect, getUserDashboard);

userRoutes
.route("/get-current-user")
.get(protect, getCurrentUser)

export default userRoutes;
 