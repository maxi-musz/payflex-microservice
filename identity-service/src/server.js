import express from "express";
import colors from "colors";
import cors from "cors";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import asyncHandler from "./middlewares/asyncHandler.js";
import helmet from "helmet";
import authRoutes from "./routes/authRoutes.js";
import userRoutes from "./routes/user.routes.js";
import transferRoutes from "./routes/transfer.routes.js";
import db from "./config/db.js";
import rateLimiterMiddleware from "./config/rateLimiter.js";
import errorHandler from "./middlewares/errorHandler.js";
import logger from "./common/utils/logger.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4001; // Set default port if undefined

// Secure HTTP headers
app.use(helmet());

// CORS settings for API Gateway
app.use(
  cors({
    origin: process.env.API_GATEWAY_URL || "*",
    credentials: true,
  })
);

// Middleware for JSON, cookies, and URL encoding
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Health check route
app.get(
  "/",
  asyncHandler(async (req, res) => {
    logger.info(colors.magenta("Identity Service Payflex microservice API is running"));
    res.status(200).json({ message: "Identity Service Payflex microservice API is running" });
  })
);

// Rate limiter
app.use(rateLimiterMiddleware);

// Routes
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/user", userRoutes);
app.use("/api/v1/ngn-transfer", transferRoutes);

// Global error handler
app.use(errorHandler);

// Catch-all route for unknown endpoints
app.use(
  "*",
  asyncHandler(async (req, res) => {
    logger.error(colors.red("Route not found"));
    res.status(404).json({ success: false, message: "Route not found" });
  })
);

// Database connection with error handling
(async () => {
  try {
    await db.connectDb();
    app.listen(PORT, () => {
      logger.info(`Identity service running on port ${PORT}`);
    });
  } catch (error) {
    logger.error(colors.red("Failed to connect to database:", error.message));
    process.exit(1); // Exit process if DB connection fails
  }
})();

// Handle unhandled promise rejections
process.on("unhandledRejection", (reason, promise) => {
  logger.error(`Unhandled Rejection at: ${promise}, reason: ${reason}`);
});
