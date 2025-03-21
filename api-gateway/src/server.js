import express from "express";
import proxy from "express-http-proxy";
import dotenv from "dotenv";
import { RateLimiterRedis } from "rate-limiter-flexible";
import redisClient from "./config/redisClient.js";
import logger from "./utils/logger.js"
import asyncHandler from "./middlewares/asyncHandler.js";
import colors from "colors";
import morgan from "morgan"

dotenv.config();

const app = express();
const port = process.env.PORT;

app.use(morgan("dev"))

// Rate limiting setup
const rateLimiter = new RateLimiterRedis({
  storeClient: redisClient,
  keyPrefix: "gateway",
  points: 100, // Allow 100 requests
  duration: 60, // per 60 seconds (1 min)
});

// Rate-limiting middleware
app.use(async (req, res, next) => {
  try {
    const rateLimitRes = await rateLimiter.consume(req.ip);
    console.log(
      `Request allowed. Remaining: ${rateLimitRes.remainingPoints}, Reset in: ${rateLimitRes.msBeforeNext}ms`
    );
    next();
  } catch (rateLimitError) {
    console.log(`Rate limit exceeded for IP: ${req.ip}`);
    res.status(429).json({
      success: false,
      message: `Rate limit exceeded. Try again in ${Math.ceil(rateLimitError.msBeforeNext / 1000)}s`,
    });
  }
});

app.use((req, res, next) => {
  logger.info(`Received ${req.method} request to ${req.url}`);
  logger.info(`Request body, ${req.body}`);
  next();
});

const proxyOptions = {
  proxyReqPathResolver: (req) => {
    return req.originalUrl.replace(/^\/v1/, "/api");
  },
  proxyErrorHandler: (err, res, next) => {
    logger.error(`Proxy error: ${err.message}`);
    res.status(500).json({
      message: `Internal server error`,
      error: err.message,
    });
  },
};


// Proxy for Identity Service
app.use(
  "/api/v1/auth",
  proxy(process.env.IDENTITY_SERVICE_URL, {
    ...proxyOptions,
    proxyReqOptDecorator: (proxyReqOpts, srcReq) => {
      proxyReqOpts.headers["Content-Type"] = "application/json";
      return proxyReqOpts;
    },
    userResDecorator: (proxyRes, proxyResData, userReq, userRes) => {
      logger.info(
        `Response received from Identity service: ${proxyRes.statusCode}`
      );

      return proxyResData;
    },
  })
);

// Catch-all for unknown routes
app.use(
  "*",
  asyncHandler(async (req, res) => {
    logger.error(colors.red("From API-Gateway, Route not found"));
    res.status(404).json({ success: false, message: "Route not found" });
  })
);

app.listen(port, () => {
  console.log(`API Gateway running on port ${port}`);
});
