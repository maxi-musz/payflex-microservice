import { createClient } from "redis";
import colors from "colors"

import dotenv from "dotenv";
dotenv.config();


// const client = createClient({
//   url: process.env.NODE_ENV === "development"
//     ? process.env.REDIS_DEV_URL  // Local Redis
//     : process.env.UPSTASH_REDIS_REST_URL,  // Cloud Redis (Upstash)
// });

const client = createClient({
  username: 'default',
  password: process.env.REDIS_PASSWORD,
  socket: {
      host: process.env.REDIS_HOST,
      port: process.env.REDIS_PORT
  }
}); 

client.on("error", (err) => console.error("❌ Redis Error:", err));

const connectRedis = async () => {
  try {
    if (!client.isOpen) {
      await client.connect();
      console.log(colors.yellow("✅ Redis connected successfully"));
    }
  } catch (error) {
    console.error("❌ Redis connection failed:", error);
  }
};

// Call the function to connect Redis
await connectRedis();

export default client;
