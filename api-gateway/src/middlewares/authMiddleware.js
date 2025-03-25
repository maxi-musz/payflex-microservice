import jwt from "jsonwebtoken";

export const verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];

  if (!token) {
    return res.status(401).json({ success: false, message: "No token provided" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET); // Use the same secret from identity service
    req.user = decoded; // Attach user data to request
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: "Invalid token" });
  }
};