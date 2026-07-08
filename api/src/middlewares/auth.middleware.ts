import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { sendError } from '../utils/response.js';

export interface AuthRequest extends Request {
  userId?: string;
}

export const authenticate = (req: AuthRequest, res: Response, next: NextFunction) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return sendError(res, 'No token provided', 401);

  try {
    const decoded = jwt.verify(token, env.JWT_SECRET) as { userId: string };
    req.userId = decoded.userId;
    next();
  } catch {
    sendError(res, 'Invalid or expired token', 401);
  }
};
