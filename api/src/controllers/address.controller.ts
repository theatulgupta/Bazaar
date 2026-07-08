import { Request, Response } from 'express';
import { z } from 'zod';
import { User } from '../models/User.model.js';
import { sendSuccess, sendError } from '../utils/response.js';

const addressSchema = z.object({
  name: z.string().min(2),
  mobile: z.string().length(10),
  houseNo: z.string().min(1),
  street: z.string().min(1),
  landmark: z.string().min(1),
  pincode: z.string().length(6),
  city: z.string().min(1),
  state: z.string().min(1),
});

export const addAddress = async (req: Request, res: Response) => {
  try {
    const { userId, address } = req.body;
    const parsed = addressSchema.safeParse(address);
    if (!parsed.success) return sendError(res, parsed.error.errors[0].message);

    const user = await User.findById(userId);
    if (!user) return sendError(res, 'User not found', 404);

    user.addresses.push(parsed.data);
    await user.save();
    sendSuccess(res, { message: 'Address added' }, 201);
  } catch (err) {
    sendError(res, 'Failed to add address', 500);
  }
};

export const getAddresses = async (req: Request, res: Response) => {
  try {
    const user = await User.findById(req.params.userId).select('addresses');
    if (!user) return sendError(res, 'User not found', 404);
    sendSuccess(res, user.addresses);
  } catch (err) {
    sendError(res, 'Failed to fetch addresses', 500);
  }
};

export const deleteAddress = async (req: Request, res: Response) => {
  try {
    const { userId, addressId } = req.params;
    const user = await User.findById(userId);
    if (!user) return sendError(res, 'User not found', 404);

    user.addresses = user.addresses.filter((a) => a._id?.toString() !== addressId);
    await user.save();
    sendSuccess(res, { message: 'Address removed' });
  } catch (err) {
    sendError(res, 'Failed to delete address', 500);
  }
};
