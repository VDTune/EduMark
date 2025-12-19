import User from "../models/userModel.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import validator from "validator";
import crypto from "crypto";
import sendEmail from "../utils/sendEmail.js";

const createToken = (id, role) => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || "7d" });
};

// 1. Đăng ký (Cập nhật: Gửi email xác thực cho Teacher)
const registerUser = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    if (!name || !email || !password) return res.status(400).json({ success: false, message: "Thiếu thông tin bắt buộc" });

    if (!validator.isEmail(email)) return res.status(400).json({ success: false, message: "Email không hợp lệ" });
    if (password.length < 8) return res.status(400).json({ success: false, message: "Mật khẩu phải từ 8 ký tự" });

    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ success: false, message: "Email đã tồn tại" });

    const salt = await bcrypt.genSalt(10);
    const hashed = await bcrypt.hash(password, salt);

    // Tạo verification token
    const verificationToken = crypto.randomBytes(20).toString("hex");

    // Nếu là teacher thì isVerified = false, student có thể cho true luôn (tùy nghiệp vụ)
    // Ở đây mình để teacher bắt buộc xác thực
    const isVerified = role === "teacher" ? false : true;

    const user = new User({ 
      name, 
      email, 
      password: hashed, 
      role: role || "student",
      isVerified,
      verificationToken: role === "teacher" ? verificationToken : undefined
    });
    
    await user.save();

    // Gửi email xác thực nếu là teacher
    if (role === "teacher") {
      const verifyUrl = `${process.env.CLIENT_URL || 'http://localhost:5173'}/verify-email/${verificationToken}`;
      const message = `
        <h1>Xác thực tài khoản Giáo viên</h1>
        <p>Vui lòng click vào link sau để kích hoạt tài khoản:</p>
        <a href="${verifyUrl}">${verifyUrl}</a>
      `;
      try {
        await sendEmail({ email: user.email, subject: "EduMark - Xác thực tài khoản", message });
        return res.status(201).json({ success: true, message: "Đăng ký thành công! Vui lòng kiểm tra email để xác thực tài khoản." });
      } catch (err) {
        console.error("Gửi mail thất bại:", err);
        // Có thể rollback user nếu muốn, ở đây ta cứ trả về success nhưng báo lỗi mail
        return res.status(201).json({ success: true, message: "Đăng ký thành công nhưng không gửi được email. Vui lòng liên hệ admin." });
      }
    }

    const token = createToken(user._id, user.role);
    res.status(201).json({ success: true, token, data: { id: user._id, name: user.name, email: user.email, role: user.role } });
  } catch (error) {
    console.error("registerUser error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// 2. Xác thực Email (Mới)
const verifyEmail = async (req, res) => {
  try {
    const { token } = req.params;
    const user = await User.findOne({ verificationToken: token });

    if (!user) return res.status(400).json({ success: false, message: "Token không hợp lệ hoặc đã hết hạn" });

    user.isVerified = true;
    user.verificationToken = undefined;
    await user.save();

    res.json({ success: true, message: "Xác thực thành công! Bạn có thể đăng nhập ngay." });
  } catch (error) {
    res.status(500).json({ success: false, message: "Lỗi xác thực" });
  }
};

// 3. Đăng nhập (Cập nhật: Check Role + isVerified)
const loginUser = async (req, res) => {
  try {
    const { email, password, role } = req.body; // Nhận thêm role từ frontend
    if (!email || !password) return res.status(400).json({ success: false, message: "Thiếu email hoặc mật khẩu" });

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ success: false, message: "Người dùng không tồn tại" });

    // Kiểm tra Role có khớp không
    if (role && user.role !== role) {
      return res.status(403).json({ success: false, message: `Tài khoản này không phải là ${role === 'teacher' ? 'Giáo viên' : 'Học sinh'}` });
    }

    // Kiểm tra xác thực (chỉ áp dụng cho Teacher nếu muốn chặt chẽ)
    if (user.role === 'teacher' && !user.isVerified) {
      return res.status(401).json({ success: false, message: "Vui lòng xác thực email trước khi đăng nhập" });
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ success: false, message: "Sai mật khẩu" });

    const token = createToken(user._id, user.role);
    res.json({ success: true, token, data: { id: user._id, name: user.name, email: user.email, role: user.role } });
  } catch (error) {
    console.error("loginUser error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// 4. Quên mật khẩu (Mới)
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ success: false, message: "Email không tồn tại trong hệ thống" });

    // Tạo reset token
    const resetToken = crypto.randomBytes(20).toString("hex");
    
    // Hash token để lưu vào DB (bảo mật)
    user.resetPasswordToken = crypto.createHash("sha256").update(resetToken).digest("hex");
    user.resetPasswordExpire = Date.now() + 10 * 60 * 1000; // 10 phút
    await user.save();

    const resetUrl = `${process.env.CLIENT_URL || 'http://localhost:5173'}/reset-password/${resetToken}`;
    
    const message = `
      <h1>Yêu cầu đặt lại mật khẩu</h1>
      <p>Click vào link dưới đây để đặt lại mật khẩu (hiệu lực 10 phút):</p>
      <a href="${resetUrl}">${resetUrl}</a>
    `;

    try {
      await sendEmail({ email: user.email, subject: "EduMark - Đặt lại mật khẩu", message });
      res.json({ success: true, message: "Đã gửi email hướng dẫn đặt lại mật khẩu." });
    } catch (err) {
      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;
      await user.save();
      return res.status(500).json({ success: false, message: "Không thể gửi email" });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// 5. Đặt lại mật khẩu (Mới)
const resetPassword = async (req, res) => {
  try {
    const resetPasswordToken = crypto.createHash("sha256").update(req.params.token).digest("hex");

    const user = await User.findOne({
      resetPasswordToken,
      resetPasswordExpire: { $gt: Date.now() }
    });

    if (!user) return res.status(400).json({ success: false, message: "Token không hợp lệ hoặc đã hết hạn" });

    if (req.body.password.length < 8) return res.status(400).json({ success: false, message: "Mật khẩu phải >= 8 ký tự" });

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(req.body.password, salt);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    
    await user.save();

    res.json({ success: true, message: "Đổi mật khẩu thành công! Vui lòng đăng nhập lại." });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// GET Profile (Giữ nguyên)
const getUserProfile = async (req, res) => {
  try {
    const userId = req.user.userId;
    const user = await User.findById(userId).select("-password").populate("classes", "name");
    if (!user) return res.status(404).json({ success: false, message: "User not found" });
    res.json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

export { registerUser, loginUser, getUserProfile, verifyEmail, forgotPassword, resetPassword };