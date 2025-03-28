import express from "express";
import proxy from "express-http-proxy";
import dotenv from "dotenv";
import { RateLimiterRedis } from "rate-limiter-flexible";
import redisClient from "./config/redisClient.js";
import logger from "./utils/logger.js";
import asyncHandler from "./middlewares/asyncHandler.js";
import colors from "colors";
import cookieParser from "cookie-parser";
import stripAnsi from "strip-ansi";
import { validateToken } from "./middlewares/authMiddleware.js";

dotenv.config();

const app = express();
const port = process.env.PORT;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser()); // ✅ Ensure cookie parsing is enabled

// Rate limiting setup
const rateLimiter = new RateLimiterRedis({
  storeClient: redisClient,
  keyPrefix: "gateway",
  points: 25, // Allow 25 requests
  duration: 60, // per 60 seconds (1 min)
});

// Rate-limiting middleware
app.use(async (req, res, next) => {
  try {
    const rateLimitRes = await rateLimiter.consume(req.ip);
    console.log(
      colors.blue(`Request allowed. Remaining: ${rateLimitRes.remainingPoints}, Reset in: ${rateLimitRes.msBeforeNext}ms`)
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

// Logging Middleware
app.use((req, res, next) => {
  logger.info(`Received ${req.method} request to ${req.url}`);
  logger.info(`Request body: ${JSON.stringify(req.body)}`);
  next();
});

const proxyOptions = {
  proxyReqPathResolver: (req) => {
    const resolvedPath = req.originalUrl.replace(/^\/v1/, "/api");
    console.log(colors.blue("Proxying request to:", resolvedPath));
    return resolvedPath;
  },
  proxyErrorHandler: (err, res, next) => {
    logger.error(colors.red(`Proxy error: ${err}`));
    res.status(500).json({
      message: `Internal server error`,
      error: err.message,
    });
  },
};

// ✅ Fixed Proxy Middleware for Identity Service
app.use(
  "/api/v1/auth",
  proxy(process.env.IDENTITY_SERVICE_URL, {
    ...proxyOptions,
    proxyReqOptDecorator: (proxyReqOpts, srcReq) => {
      proxyReqOpts.headers["Content-Type"] = "application/json";
      if (srcReq.headers.cookie) {
        proxyReqOpts.headers["cookie"] = srcReq.headers.cookie;
      }
      return proxyReqOpts;
    },
    userResHeaderDecorator: (headers, userReq, userRes, proxyReq, proxyRes) => {
      headers["Access-Control-Allow-Credentials"] = "true";
      return headers;
    },
    userResDecorator: (proxyRes, proxyResData, userReq, userRes) => {
      logger.info(
        colors.magenta(
          `Response received from Identity service: ${proxyRes.statusCode}`
        )
      );
      
      // Convert response to string and strip ANSI codes
      const rawData = proxyResData.toString("utf-8");
      const cleanData = stripAnsi(rawData);
      
      try {
        const data = JSON.parse(cleanData);
        return JSON.stringify(data);
      } catch (err) {
        logger.error("Error parsing proxy response:", err);
        return proxyResData;
      }
    },
  })
);

// ✅ Fixed Proxy Middleware for Identity Service
app.use(
  "/api/v1/users",
  proxy(process.env.IDENTITY_SERVICE_URL, {
    ...proxyOptions,
    proxyReqOptDecorator: (proxyReqOpts, srcReq) => {
      proxyReqOpts.headers["Content-Type"] = "application/json";
      
      // ✅ Forward cookies to identity service
      if (srcReq.headers.cookie) {
        proxyReqOpts.headers["cookie"] = srcReq.headers.cookie;
      }

      return proxyReqOpts;
    },
    userResHeaderDecorator: (headers, userReq, userRes, proxyReq, proxyRes) => {
      // ✅ Allow cookies from Banking Service to be returned to the client
      headers["Access-Control-Allow-Credentials"] = "true";
      return headers;
    },
    userResDecorator: (proxyRes, proxyResData, userReq, userRes) => {
      logger.info(colors.magenta(`Response received from Identity service: ${proxyRes.statusCode}`));
      
      try {
        const data = JSON.parse(proxyResData.toString("utf-8"));
        return JSON.stringify(data);
      } catch (err) {
        logger.error("Error parsing proxy response:", err);
        return proxyResData;
      }
    },
  })
);

// ✅ Fixed Proxy Middleware for Transaction hisory Service
app.use(
  "/api/v1/history",
  validateToken,
  proxy(process.env.TRANSACTION_HISTORY_SERVICE_URL, {
    ...proxyOptions,
    proxyReqOptDecorator: (proxyReqOpts, srcReq) => {
      proxyReqOpts.headers["Content-Type"] = "application/json";
      proxyReqOpts.headers["x-user-id"] = srcReq.user.userId;
      
      // ✅ Forward cookies to transaction history service
      if (srcReq.headers.cookie) {
        proxyReqOpts.headers["cookie"] = srcReq.headers.cookie;
      }

      // ✅ Forward Authorization header
      if (srcReq.headers.authorization) {
        proxyReqOpts.headers["Authorization"] = srcReq.headers.authorization;
        
      }

      return proxyReqOpts;
    },
    userResHeaderDecorator: (headers, userReq, userRes, proxyReq, proxyRes) => {
      // ✅ Allow cookies from Banking Service to be returned to the client
      headers["Access-Control-Allow-Credentials"] = "true";
      return headers;
    },
    userResDecorator: (proxyRes, proxyResData, userReq, userRes) => {
      logger.info(colors.magenta(`Response received from Trans-History service: ${proxyRes.statusCode}`));
    
      try {
        const data = JSON.parse(proxyResData.toString("utf-8"));
        return JSON.stringify(data);
      } catch (err) {
        logger.error("Error parsing proxy response: Response is not JSON", {
          statusCode: proxyRes.statusCode,
          body: proxyResData.toString("utf-8").slice(0, 200), // Log first 200 chars
        });
    
        // Return a generic error response instead of crashing
        return JSON.stringify({
          success: false,
          message: "Unexpected response format from service",
          statusCode: proxyRes.statusCode,
        });
      }
    }
    ,
  })
);

// ✅ Fixed Proxy Middleware for Identity Service
app.use(
  "/api/v1/banking",
  proxy(process.env.BANKING_SERVICE_URL, {
    ...proxyOptions,
    proxyReqOptDecorator: (proxyReqOpts, srcReq) => {
      proxyReqOpts.headers["Content-Type"] = "application/json";
      
      // ✅ Forward cookies to identity service
      if (srcReq.headers.cookie) {
        proxyReqOpts.headers["cookie"] = srcReq.headers.cookie;
      }

      return proxyReqOpts;
    },
    userResHeaderDecorator: (headers, userReq, userRes, proxyReq, proxyRes) => {
      // ✅ Allow cookies from Banking Service to be returned to the client
      headers["Access-Control-Allow-Credentials"] = "true";
      return headers;
    },
    userResDecorator: (proxyRes, proxyResData, userReq, userRes) => {
      logger.info(colors.grey(`Response received from Banking service: ${proxyRes.statusCode}`));
      
      try {
        const data = JSON.parse(proxyResData.toString("utf-8"));
        return JSON.stringify(data);
      } catch (err) {
        logger.error("Error parsing proxy response:", err);
        return proxyResData;
      }
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
