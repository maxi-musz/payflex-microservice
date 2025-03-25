import redisClient from "../config/redisClient.js";
import prisma from "../config/prismaClient.js";
import jwt from 'jsonwebtoken';
import colors from "colors"

const protect = async (req, res, next) => {
  try {
    let token = req.headers.authorization?.split(" ")[1];

    if (!token) {
      console.log("❌ Not authorized: No token provided");
      return res.status(401).json({ message: "Not authorized, no token" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log(decoded)
    const cacheKey = `user:${decoded.userId}`;

    let user = await redisClient.get(cacheKey);

    if (user) {
      console.log(colors.bgWhite("✅ User found in cache:", decoded.userId));
      req.user = JSON.parse(user);
    } else {
      console.log(colors.red("🔍 User not found in cache, fetching from database...", decoded.userId));
      user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: { id: true }
      })

      if (!user) {
        console.log(colors.red("❌ Not authorized: User not found"));
        return res.status(401).json({ message: "Not authorized, user not found" });
      }

      console.log(colors.cyan("user found in database: ", user.email))
      await redisClient.setEx(cacheKey, 3600, JSON.stringify(user));
      req.user = user;
    }

    next();
  } catch (error) {
    console.error("❌ Token verification failed:", error.message);
    return res.status(401).json({ 
      success: false,
      message: "Not authorized, invalid token"
     });
  }
};

export default protect;
