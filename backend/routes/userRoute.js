import express from "express";
import { 
  registerUser, 
  loginUser, 
  getUserProfile, 
  verifyEmail, 
  forgotPassword, 
  resetPassword 
} from "../controllers/userController.js";
import authMiddleware from "../middleware/auth.js";

const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginUser);
router.get("/profile", authMiddleware, getUserProfile);

// Routes mới
router.get("/verify/:token", verifyEmail);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password/:token", resetPassword);

export default router;