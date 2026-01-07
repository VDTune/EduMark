import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

const sendEmail = async ({ email, subject, message }) => {
  try {
    const { data, error } = await resend.emails.send({
      from: process.env.EMAIL_FROM,
      to: email,
      subject: subject,
      html: message,
    });

    if (error) {
      console.error("❌ RESEND ERROR:", error);
      throw new Error(error.message);
    }

    console.log("✅ Email sent via Resend:", data.id);
    return true;
  } catch (error) {
    console.error("❌ SEND EMAIL FAILED:", error);
    throw new Error("Không thể gửi email");
  }
};

export default sendEmail;
