import nodemailer from "nodemailer"
import { otpVerificationCodeTemplate, welcomeEmail } from "./email-template.js";

export const sendOTPByEmail = async (email,otp) => {
  
    try {
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        host: process.env.GOOGLE_SMTP_HOST,
        port: process.env.GOOGLE_SMTP_PORT,
        secure: false,
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASSWORD,
        },
      });
  
      const otpExpiresAt = "5 minutes"
      const htmlContent = otpVerificationCodeTemplate(email, otp, otpExpiresAt);
  
      const mailOptions = {
        from: {
          name: "PayFlex LTD",
          address: process.env.EMAIL_USER,
        },
        to: email,
        subject: `Login OTP Confirmation Code: ${otp}`,
        html: htmlContent
      };
  
      await transporter.sendMail(mailOptions);
    } catch (error) {
      console.error('Error sending otp email:', error);
      throw new Error('Failed to send OTP email');
    }
  };


export const sendWelcomeEmail = async (email, firstName) => {
  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      host: process.env.GOOGLE_SMTP_HOST,
      port: process.env.GOOGLE_SMTP_PORT,
      secure: false,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
    });

    const htmlContent = welcomeEmail(firstName);

    const mailOptions = {
      from: {
        name: "PayFlex LTD",
        address: process.env.EMAIL_USER,
      },
      to: email,
      subject: 'Welcome to PayFlex',
      html: htmlContent
    };

    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error('Error sending welcome email:', error);
    throw new Error('Failed to send welcome email');
  }
}