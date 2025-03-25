import express from "express";
import dotenv from "dotenv";
import colors from "colors"
import helmet from "helmet";
import cors from "cors"
import cookieParser from "cookie-parser";
import rateLimiterMiddleware from "./config/rateLimiter.js";
import logger from "./common/utils/logger.js";
import asyncHandler from "./middlewares/asyncHandler.js";

// Route import
import historyRoute from "./routes/transaction.routes.js";

dotenv.config()

const app = express()
const PORT = process.env.PORT || 4002
const API_GATEWAY_URL = process.env.API_GATEWAY_URL;

// Middlewares
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(cookieParser());
app.use(rateLimiterMiddleware);

app.use(express.urlencoded({ extended: true }));
app.use(
  cors({
    origin: "*",
    credentials: true,
  })
);

app.use("/api/v1/history", historyRoute)

app.get(
  "/",
  asyncHandler(async (req, res) => {
    logger.info(colors.magenta("Transaction History Service Payflex microservice API is running"));
    res.status(200).json({ message: "Transaction History Service Payflex microservice API is running" });
  })
);

app.listen(PORT, async () => {
    logger.info(colors.yellow(`Transaction History service running on port ${PORT}`));
});

// unhandled promise rejection
process.on("unhandledRejection", (reason, promise) => {
    logger.error("Unhandled Rejection at", promise, "reason:", reason);
});