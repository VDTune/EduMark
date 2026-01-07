import nodemailer from "nodemailer";

const sendEmail = async (options) => {
  // 1. Tạo transporter với cấu hình "chống treo"
  const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,              // Dùng Port SSL thay vì 587
    secure: true,           // Bắt buộc true khi dùng port 465
    auth: {
      user: process.env.EMAIL_USERNAME, // Đảm bảo tên biến khớp với Railway
      pass: process.env.EMAIL_PASSWORD,
    },
    // Quan trọng: Ép dùng IPv4 để tránh lỗi mạng trên Docker/Railway
    family: 4, 
  });

  // 2. Cấu hình email
  const mailOptions = {
    from: `"EduMark Support" <${process.env.EMAIL_USERNAME}>`,
    to: options.email,
    subject: options.subject,
    html: options.message,
  };

  // 3. Gửi và log lỗi nếu có
  try {
    const info = await transporter.sendMail(mailOptions);
    console.log("Email sent successfully:", info.messageId);
  } catch (error) {
    console.error("GMAIL SEND ERROR:", error);
    throw new Error("Không thể gửi email: " + error.message);
  }
};

export default sendEmail;