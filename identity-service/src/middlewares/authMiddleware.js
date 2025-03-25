import jwt from 'jsonwebtoken';
import colors from "colors";

const protect = async (req, res, next) => {
  try {
    let token = req.headers.authorization?.split(" ")[1];

    if (!token) {
      console.log(colors.red("❌ Not authorized: No token provided"));
      return res.status(401).json({ success: false, message: "Not authorized, no token" });
    }

    // ✅ Decode JWT without DB lookup
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (!decoded || !decoded.userId) {
      console.log(colors.red("❌ Invalid token payload"));
      return res.status(401).json({ success: false, message: "Not authorized, invalid token" });
    }

    req.user = { id: decoded.userId, email: decoded.email }; // Use only decoded data
    req.token = token; // Pass token for forwarding

    next();
  } catch (error) {
    console.error("❌ Token verification failed:", error.message);
    return res.status(401).json({ success: false, message: "Not authorized, invalid token" });
  }
};

export default protect;

