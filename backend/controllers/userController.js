// backend/controllers/userController.js
import User from "../models/userModel.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import validator from "validator";

const createToken = (id, role) => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || "7d" });
};

// POST /api/users/register
const registerUser = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    if (!name || !email || !password) return res.status(400).json({ success: false, message: "Missing fields" });

    // validate email/password
    if (!validator.isEmail(email)) return res.status(400).json({ success: false, message: "Invalid email" });
    if (password.length < 8) return res.status(400).json({ success: false, message: "Password too short (>=8)" });

    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ success: false, message: "User already exists" });

    const salt = await bcrypt.genSalt(10);
    const hashed = await bcrypt.hash(password, salt);

    const user = new User({ name, email, password: hashed, role: role || "student" });
    await user.save();

    const token = createToken(user._id, user.role);
    res.status(201).json({ success: true, token, data: { id: user._id, name: user.name, email: user.email, role: user.role } });
  } catch (error) {
    console.error("registerUser error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// POST /api/users/login
const loginUser = async (req, res) => {
  try {
    console.log('Login attempt:', req.body); // Debug
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ success: false, message: "Missing fields" });

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ success: false, message: "Invalid password" });

    const token = createToken(user._id, user.role);
    console.log('Login successful, token:', token); // Debug
    res.json({ success: true, token, data: { id: user._id, name: user.name, email: user.email, role: user.role } });
  } catch (error) {
    console.error("loginUser error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// GET /api/users/profile  (protected)
const getUserProfile = async (req, res) => {
  try {
    const userId = req.user.userId;
    const user = await User.findById(userId).select("-password").populate("classes", "name");
    if (!user) return res.status(404).json({ success: false, message: "User not found" });
    res.json({ success: true, data: user });
  } catch (error) {
    console.error("getUserProfile error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

export { registerUser, loginUser, getUserProfile };
