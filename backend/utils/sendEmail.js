import nodemailer from "nodemailer";

const sendEmail = async (options) => {
  // Cấu hình thủ công Host và Port để tránh bị treo
  const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false, // false cho port 587, true cho port 465
    auth: {
      user: process.env.EMAIL_USERNAME,
      pass: process.env.EMAIL_PASSWORD,
    },
    tls: {
        rejectUnauthorized: false // Bỏ qua lỗi chứng chỉ nếu có (giúp kết nối dễ hơn)
    }
  });

  const mailOptions = {
    from: `"EduMark Support" <${process.env.EMAIL_USERNAME}>`,
    to: options.email,
    subject: options.subject,
    html: options.message,
  };

  await transporter.sendMail(mailOptions);
};

export default sendEmail;