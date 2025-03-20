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
const PORT = process.env.PORT;
const BASE_PATH = process.env.BASE_PATH;

// Middlewares
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(cookieParser());

app.use(express.urlencoded({ extended: true }));
app.use(
  cors({
    origin: process.env.APP_ORIGIN,
    credentials: true,
  })
);

app.get(
  "/",
  asyncHandler(async (req, res) => {
    logger.info(colors.magenta("Payflex microservice express API is running"));
    res.status(200).json({ message: "Payflex microservice API is running" });
  })
);

// app.use(rateLimiterMiddleware);
app.use(`${BASE_PATH}/auth`,rateLimiterMiddleware, authRoutes);
app.use(`${BASE_PATH}/user`, userRoutes);
app.use(`${BASE_PATH}/ngn-transfer`, transferRoutes);

app.use(errorHandler)

// Catch-all for unknown routes
app.use(
  "*",
  asyncHandler(async (req, res) => {
    logger.error(colors.red("Route not found"));
    res.status(404).json({ success: false, message: "Route not found" });
  })
);

await db.connectDb();
app.listen(PORT, async () => {
  logger.info(`Identity service running on port ${PORT}`);
});

// unhandled promise rejection
process.on("unhandledRejection", (reason, promise) => {
  logger.error("Unhandled Rejection at", promise, "reason:", reason);
});
