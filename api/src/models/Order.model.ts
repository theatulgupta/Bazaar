import mongoose, { Document, Schema } from 'mongoose';
import { IAddress, addressSchema } from './User.model.js';

interface IProduct {
  name: string;
  quantity: number;
  price: number;
  image: string;
}

export interface IOrder extends Document {
  user: mongoose.Types.ObjectId;
  products: IProduct[];
  totalPrice: number;
  shippingAddress: IAddress;
  paymentMethod: string;
  status: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';
}

const productSchema = new Schema<IProduct>({
  name: { type: String, required: true },
  quantity: { type: Number, required: true },
  price: { type: Number, required: true },
  image: { type: String, required: true },
});

const orderSchema = new Schema<IOrder>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    products: [productSchema],
    totalPrice: { type: Number, required: true, default: 0 },
    shippingAddress: { type: addressSchema, required: true },
    paymentMethod: { type: String, required: true },
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'],
      default: 'pending',
    },
  },
  { timestamps: true }
);

export const Order = mongoose.model<IOrder>('Order', orderSchema);
