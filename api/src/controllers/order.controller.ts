import { Request, Response } from 'express';
import { z } from 'zod';
import { Order } from '../models/Order.model.js';
import { User } from '../models/User.model.js';
import { sendSuccess, sendError } from '../utils/response.js';

const orderSchema = z.object({
  userId: z.string(),
  cartItems: z.array(
    z.object({
      title: z.string(),
      quantity: z.number().int().positive(),
      price: z.number().positive(),
      image: z.string().url(),
    })
  ),
  totalPrice: z.number().positive(),
  shippingAddress: z.object({
    name: z.string(),
    mobile: z.string(),
    houseNo: z.string(),
    street: z.string(),
    landmark: z.string(),
    pincode: z.string(),
    city: z.string(),
    state: z.string(),
  }),
  paymentMethod: z.enum(['cash', 'card', 'upi']),
});

export const createOrder = async (req: Request, res: Response) => {
  try {
    const parsed = orderSchema.safeParse(req.body);
    if (!parsed.success) return sendError(res, parsed.error.errors[0].message);

    const { userId, cartItems, totalPrice, shippingAddress, paymentMethod } = parsed.data;

    const user = await User.findById(userId);
    if (!user) return sendError(res, 'User not found', 404);

    const products = cartItems.map((item) => ({
      name: item.title,
      quantity: item.quantity,
      price: item.price,
      image: item.image,
    }));

    const order = await Order.create({ user: userId, products, totalPrice, shippingAddress, paymentMethod });
    user.orders.push(order._id);
    await user.save();

    sendSuccess(res, { orderId: order._id }, 201);
  } catch (err) {
    sendError(res, 'Failed to create order', 500);
  }
};

export const getUserOrders = async (req: Request, res: Response) => {
  try {
    const orders = await Order.find({ user: req.params.userId }).sort({ createdAt: -1 });
    sendSuccess(res, orders);
  } catch (err) {
    sendError(res, 'Failed to fetch orders', 500);
  }
};

export const getOrderById = async (req: Request, res: Response) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return sendError(res, 'Order not found', 404);
    sendSuccess(res, order);
  } catch (err) {
    sendError(res, 'Failed to fetch order', 500);
  }
};
