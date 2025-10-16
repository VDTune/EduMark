// backend/routes/userRoute.js
import express from "express";
import { registerUser, loginUser, getUserProfile } from "../controllers/userController.js";
import authMiddleware from "../middleware/auth.js";

const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginUser);
router.get("/profile", authMiddleware, getUserProfile);

export default router;