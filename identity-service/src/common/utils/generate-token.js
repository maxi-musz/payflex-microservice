import jwt from "jsonwebtoken";

const generateTokens = (res, userId) => {
    const accessToken = jwt.sign({ userId }, process.env.JWT_SECRET, {
        expiresIn: process.env.USER_ACCESS_TOKEN_EXPIRATION_TIME // Access token expires in 15 minutes
    });

    const refreshToken = jwt.sign({ userId }, process.env.JWT_SECRET, {
        expiresIn: process.env.USER_REFRESH_TOKEN_EXPIRATION_TIME // Refresh token expires in 7 days
    });
      
    res.cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV !== "development", // Set to true in production
        sameSite: "Strict",
        maxAge: 24 * 60 * 60 * 1000, // Cookie expiration 1 day
    });

    return { accessToken, refreshToken };
}

export default generateTokens; 