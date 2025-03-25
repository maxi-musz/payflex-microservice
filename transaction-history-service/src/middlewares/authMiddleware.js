import jwt from "jsonwebtoken";
import axios from "axios";
import colors from "colors";

const protect = async (req, res, next) => {
  console.log(colors.grey("🔍 Verifying user from: Transaction-History service"));

  try {
    let token = req.headers.authorization?.split(" ")[1];

    if (!token) {
      console.log(colors.red("❌ Not authorized: No token provided"));
      return res.status(401).json({ message: "Not authorized, no token" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (!decoded.userId) {
      console.log(colors.red("❌ Invalid token: Missing userId"));
      return res.status(401).json({ message: "Invalid token" });
    }

    console.log(colors.cyan("🔍 Fetching user from Identity Service..."));

    const IDENTITY_SERVICE_URL = process.env.IDENTITY_SERVICE_URL || "http://localhost:4001";
    const verifyIdentity = `${IDENTITY_SERVICE_URL}/api/v1/users/get-current-user/${decoded.userId}`;

    console.log("User Id: ", decoded.userId)

    try {
      const { data } = await axios.get(verifyIdentity, {
        headers: { Authorization: `Bearer ${token}` },
      });

      console.log("Data: ", data)

      if (!data || !data.success ||!data.data) {
        console.log(colors.red("❌ Not authorized: User not found in Identity Service"));
        return res.status(401).json({ message: "Not authorized, user not found" });
      }

      req.user = data.data;
      console.log(colors.green("✅ User verified:", data.data.email));

      next();
    } catch (error) {
      console.error(colors.red("❌ Error fetching user from Identity Service:", error.message));
      return res.status(401).json({ message: "Not authorized, unable to verify user" });
    }
  } catch (error) {
    console.error(colors.red("❌ Token verification failed:", error.message));
    return res.status(401).json({
      success: false,
      message: "Not authorized, invalid token",
    });
  }
};

export default protect;
