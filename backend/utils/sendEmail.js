import nodemailer from "nodemailer";

const sendEmail = async (options) => {
  // Cấu hình SMTP (Ví dụ dùng Gmail, bạn nên dùng App Password của Gmail)
  const transporter = nodemailer.createTransport({
    service: "gmail", // Hoặc host SMTP khác
    auth: {
      user: process.env.EMAIL_USERNAME, // Email của bạn
      pass: process.env.EMAIL_PASSWORD, // App Password của bạn
    },
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