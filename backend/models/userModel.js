import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ["teacher", "student"], default: "student", required: true },
  classes: [{ type: mongoose.Schema.Types.ObjectId, ref: "Classroom" }],
  
  // Mới: Xác thực email & Quên mật khẩu
  isVerified: { type: Boolean, default: false },
  verificationToken: { type: String },
  resetPasswordToken: { type: String },
  resetPasswordExpire: { type: Date }
}, { timestamps: true });

const User = mongoose.models.User || mongoose.model("User", userSchema);
export default User;