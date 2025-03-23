import express from "express";
import dotenv from "dotenv";
import colors from "colors"
import helmet from "helmet";
import cors from "cors"
import cookieParser from "cookie-parser";
import rateLimiterMiddleware from "./config/rateLimiter.js";
import logger from "./common/utils/logger.js";
import asyncHandler from "./middlewares/asyncHandler.js";

// routes
import bankingRoutes from "./routes/banking.route.js"

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

app.use("/api/v1/banking", bankingRoutes)

app.get(
  "/",
  asyncHandler(async (req, res) => {
    logger.info(colors.magenta("Banking Service Payflex microservice API is running"));
    res.status(200).json({ message: "Banking Service Payflex microservice API is running" });
  })
);

// Catch-all route for unknown endpoints
app.use(
  "*",
  asyncHandler(async (req, res) => {
    logger.error(colors.red("Banking Service: Route not found"));
    res.status(404).json({ success: false, message: "Banking Service Route not found" });
  })
);


app.listen(PORT, async () => {
    logger.info(colors.yellow(`Banking service: running on port ${PORT}`));
});

// unhandled promise rejection
process.on("unhandledRejection", (reason, promise) => {
    logger.error("Unhandled Rejection at", promise, "reason:", reason);
});