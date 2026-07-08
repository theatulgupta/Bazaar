import nodemailer from 'nodemailer';
import { env } from '../config/env.js';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: { user: env.EMAIL_USER, pass: env.EMAIL_PASS },
});

export const sendVerificationEmail = async (email: string, token: string) => {
  const verifyUrl = `http://localhost:${env.PORT}/api/v1/users/verify/${token}`;
  await transporter.sendMail({
    from: `"Amazon Clone" <${env.EMAIL_USER}>`,
    to: email,
    subject: 'Verify your email',
    html: `<p>Click <a href="${verifyUrl}">here</a> to verify your account.</p>`,
  });
};
