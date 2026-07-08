import { Request, Response } from 'express';
import { User } from '../models/User.model.js';
import { sendSuccess, sendError } from '../utils/response.js';

export const getProfile = async (req: Request, res: Response) => {
  try {
    const user = await User.findById(req.params.userId).select('-password -verificationToken');
    if (!user) return sendError(res, 'User not found', 404);
    sendSuccess(res, user);
  } catch (err) {
    sendError(res, 'Failed to fetch profile', 500);
  }
};
