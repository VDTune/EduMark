// backend/middleware/auth.js
import jwt from "jsonwebtoken";
import User from "../models/userModel.js";

const authMiddleware = async (req, res, next) => {
  try {
    // hỗ trợ cả "Authorization: Bearer <token>" và headers.token
    const authHeader = req.headers.authorization || req.headers.token;
    if (!authHeader) return res.status(401).json({ success: false, message: "Unauthorized: no token" });

    const token = authHeader.startsWith("Bearer ") ? authHeader.split(" ")[1] : authHeader;
    if (!token) return res.status(401).json({ success: false, message: "Unauthorized: token missing" });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // decoded chứa { id, role } (theo createToken bên dưới)
    req.user = { userId: decoded.id, role: decoded.role };
    // (tùy chọn) fetch user info if needed:
    // req.currentUser = await User.findById(decoded.id).select("-password");

    next();
  } catch (error) {
    console.error("Auth error:", error);
    return res.status(401).json({ success: false, message: "Invalid token" });
  }
};

export default authMiddleware;
