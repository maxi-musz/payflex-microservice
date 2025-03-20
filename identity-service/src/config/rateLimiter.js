import { RateLimiterRedis, RateLimiterMemory } from "rate-limiter-flexible";
import redisClient from "./redisClient.js";
import colors from "colors";

// Use Redis only if NOT using Upstash (because Upstash lacks Lua support)
const totalRequest = 20 //total request 
const secondsInterval = 60 //withitn total time in secs

const rateLimiter = process.env.NODE_ENV === "development"
  ? new RateLimiterRedis({
      storeClient: redisClient,
      keyPrefix: "middleware",
      points: totalRequest, // 10 requests
      duration: secondsInterval, // per 1 second
    })
  : new RateLimiterMemory({
      keyPrefix: "middleware",
      points: totalRequest,
      duration: secondsInterval,
      blockDuration: 5,
    });

// Middleware to check rate limiting
const rateLimiterMiddleware = (req, res, next) => {
  rateLimiter
    .consume(req.ip)
    .then(() => next())
    .catch(() => {
      console.log(colors.red(`Rate limit exceeded for IP: ${req.ip}`));
      res.status(429).json({
        success: false,
        message: `Rate limit exceeded for IP: ${req.ip}`,
      });
    });
};

export default rateLimiterMiddleware;
