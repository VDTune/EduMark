import nodemailer from "nodemailer";

const sendEmail = async (options) => {
  try {
    // 1️⃣ Tạo transporter (chống treo trên Railway)
    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 465,
      secure: true, // BẮT BUỘC true với port 465
      auth: {
        user: process.env.EMAIL_USERNAME,
        pass: process.env.EMAIL_PASSWORD, // App Password (KHÔNG dấu cách)
      },

      // 🔥 CỰC KỲ QUAN TRỌNG CHO RAILWAY / DOCKER
      family: 4,                 // ép IPv4
      connectionTimeout: 10000,  // 10s
      greetingTimeout: 10000,
      socketTimeout: 10000,
    });

    // 2️⃣ Cấu hình email
    const mailOptions = {
      from: `"EduMark Support" <${process.env.EMAIL_USERNAME}>`,
      to: options.email,
      subject: options.subject,
      html: options.message,
    };

    // 3️⃣ Gửi email
    const info = await transporter.sendMail(mailOptions);
    console.log("✅ Email sent:", info.messageId);

    return true;
  } catch (error) {
    console.error("❌ SEND EMAIL ERROR:", {
      message: error.message,
      code: error.code,
      response: error.response,
    });

    throw new Error("Không thể gửi email, vui lòng thử lại sau.");
  }
};

export default sendEmail;
