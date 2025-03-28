// shared/authMiddleware.js
import colors from "colors"
import jwt from "jsonwebtoken"

export const validateToken = (req, res, next) => {
  console.log(colors.cyan("Verifying token"))
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    console.log(colors.red("Access attempt without valid token!"));
    return res.status(401).json({
      message: "Authentication required",
      success: false,
    });
  }
  
  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      logger.warn("Invalid token!");
      return res.status(429).json({
        message: "Invalid token!",
        success: false,
      });
    }

    req.user = user;
    next();
  });
};