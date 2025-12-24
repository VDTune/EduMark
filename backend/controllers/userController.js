import User from "../models/userModel.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import validator from "validator";
import crypto from "crypto";
import sendEmail from "../utils/sendEmail.js";

const createToken = (id, role) => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET, { expiresIn: "7d" });
};

// 1. Đăng ký
const registerUser = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password) return res.status(400).json({ success: false, message: "Thiếu thông tin" });
    if (!validator.isEmail(email)) return res.status(400).json({ success: false, message: "Email sai định dạng" });
    if (password.length < 8) return res.status(400).json({ success: false, message: "Mật khẩu >= 8 ký tự" });

    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ success: false, message: "Email đã tồn tại" });

    const salt = await bcrypt.genSalt(10);
    const hashed = await bcrypt.hash(password, salt);
    const verificationToken = crypto.randomBytes(20).toString("hex");

    const user = new User({ 
      name, email, password: hashed, 
      role: role || "student", 
      isVerified: false, // Bắt buộc xác thực với mọi role
      verificationToken 
    });
    
    await user.save();

    // Gửi email
    const verifyUrl = `${process.env.CLIENT_URL || 'http://localhost:5174'}/verify-email/${verificationToken}`;
    const message = `
      <h1>Xác thực tài khoản EduMark</h1>
      <p>Click vào link sau để kích hoạt tài khoản:</p>
      <a href="${verifyUrl}" target="_blank">${verifyUrl}</a>
    `;

    try {
      await sendEmail({ email: user.email, subject: "Kích hoạt tài khoản", message });
      return res.status(201).json({ success: true, message: "Đăng ký thành công! Vui lòng kiểm tra email để kích hoạt." });
    } catch (err) {
      console.error(err);
      return res.status(201).json({ success: true, message: "Đăng ký thành công nhưng lỗi gửi email." });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// 2. Xác thực
const verifyEmail = async (req, res) => {
  try {
    const { token } = req.params;
    const user = await User.findOne({ verificationToken: token });

    if (!user) return res.status(400).json({ success: false, message: "Token không hợp lệ hoặc đã kích hoạt." });

    user.isVerified = true;
    user.verificationToken = undefined;
    await user.save();

    res.json({ success: true, message: "Kích hoạt thành công!" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Lỗi xác thực" });
  }
};

// 3. Đăng nhập
const loginUser = async (req, res) => {
  try {
    const { email, password, role } = req.body;
    if (!email || !password) return res.status(400).json({ success: false, message: "Nhập thiếu thông tin" });

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ success: false, message: "Tài khoản không tồn tại" });

    // Check Role
    if (role && user.role !== role) {
      return res.status(403).json({ success: false, message: `Tài khoản này không phải là ${role}` });
    }

    // Check Verify
    if (!user.isVerified) {
      return res.status(401).json({ success: false, message: "Tài khoản chưa được kích hoạt. Vui lòng kiểm tra email." });
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ success: false, message: "Sai mật khẩu" });

    const token = createToken(user._id, user.role);
    res.json({ success: true, token, data: { id: user._id, name: user.name, email: user.email, role: user.role } });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// 4. Quên mật khẩu
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ success: false, message: "Email không tồn tại" });

    const resetToken = crypto.randomBytes(20).toString("hex");
    user.resetPasswordToken = crypto.createHash("sha256").update(resetToken).digest("hex");
    user.resetPasswordExpire = Date.now() + 10 * 60 * 1000; // 10 phút
    await user.save();

    const resetUrl = `${process.env.CLIENT_URL || 'http://localhost:5174'}/reset-password/${resetToken}`;
    const message = `<h1>Đặt lại mật khẩu</h1><p>Click link để đặt lại mật khẩu:</p><a href="${resetUrl}">${resetUrl}</a>`;

    try {
      await sendEmail({ email: user.email, subject: "Đặt lại mật khẩu", message });
      res.json({ success: true, message: "Email hướng dẫn đã được gửi." });
    } catch (err) {
      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;
      await user.save();
      return res.status(500).json({ success: false, message: "Gửi email thất bại" });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// 5. Đặt lại mật khẩu
const resetPassword = async (req, res) => {
  try {
    const resetPasswordToken = crypto.createHash("sha256").update(req.params.token).digest("hex");
    const user = await User.findOne({ resetPasswordToken, resetPasswordExpire: { $gt: Date.now() } });

    if (!user) return res.status(400).json({ success: false, message: "Token không hợp lệ hoặc hết hạn" });

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(req.body.password, salt);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    res.json({ success: true, message: "Đổi mật khẩu thành công!" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// 6. Get Profile
const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select("-password").populate("classes", "name");
    if (!user) return res.status(404).json({ success: false, message: "User not found" });
    res.json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

export { registerUser, loginUser, getUserProfile, verifyEmail, forgotPassword, resetPassword };