import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { User } from '../models/User.model.js';
import { env } from '../config/env.js';
import { sendVerificationEmail } from '../utils/email.js';
import { sendSuccess, sendError } from '../utils/response.js';

const registerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const register = async (req: Request, res: Response) => {
  try {
    const parsed = registerSchema.safeParse(req.body);
    if (!parsed.success) return sendError(res, parsed.error.errors[0].message);

    const { name, email, password } = parsed.data;
    const existing = await User.findOne({ email });
    if (existing) return sendError(res, 'Email already registered', 409);

    const hashed = await bcrypt.hash(password, 10);
    const verificationToken = crypto.randomBytes(20).toString('hex');
    await User.create({ name, email, password: hashed, verificationToken });

    sendVerificationEmail(email, verificationToken).catch(console.error);
    sendSuccess(res, { message: 'Registered successfully. Check your email to verify.' }, 201);
  } catch (err) {
    sendError(res, 'Registration failed', 500);
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) return sendError(res, parsed.error.errors[0].message);

    const { email, password } = parsed.data;
    const user = await User.findOne({ email });
    if (!user) return sendError(res, 'Invalid credentials', 401);

    const match = await bcrypt.compare(password, user.password);
    if (!match) return sendError(res, 'Invalid credentials', 401);

    const token = jwt.sign({ userId: user._id }, env.JWT_SECRET, {
      expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions['expiresIn'],
    });

    sendSuccess(res, { token });
  } catch (err) {
    sendError(res, 'Login failed', 500);
  }
};

export const verifyEmail = async (req: Request, res: Response) => {
  try {
    const { token } = req.params;
    const user = await User.findOne({ verificationToken: token });
    if (!user) return sendError(res, 'Invalid or expired token', 400);

    user.verified = true;
    user.verificationToken = undefined;
    await user.save();
    sendSuccess(res, { message: 'Email verified successfully' });
  } catch (err) {
    sendError(res, 'Verification failed', 500);
  }
};
