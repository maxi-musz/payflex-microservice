import { createClient } from "redis";
import colors from "colors"

const redisClient = createClient({
  url: process.env.NODE_ENV === "development"
    ? process.env.REDIS_DEV_URL  // Local Redis
    : process.env.UPSTASH_REDIS_REST_URL,  // Cloud Redis (Upstash)
});

redisClient.on("error", (err) => console.error("❌ Redis Error:", err));

const connectRedis = async () => {
  try {
    if (!redisClient.isOpen) {
      await redisClient.connect();
      console.log(colors.green("✅ Redis connected successfully"));
    }
  } catch (error) {
    console.error("❌ Redis connection failed:", error);
  }
};

// Call the function to connect Redis
await connectRedis();

export default redisClient;
