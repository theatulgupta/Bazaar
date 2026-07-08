import mongoose, { Document, Schema } from 'mongoose';

export interface IAddress {
  _id?: mongoose.Types.ObjectId;
  name: string;
  mobile: string;
  houseNo: string;
  street: string;
  landmark: string;
  pincode: string;
  city: string;
  state: string;
}

export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  verified: boolean;
  verificationToken?: string;
  addresses: IAddress[];
  orders: mongoose.Types.ObjectId[];
}

const addressSchema = new Schema<IAddress>({
  name: { type: String, required: true },
  mobile: { type: String, required: true },
  houseNo: { type: String, required: true },
  street: { type: String, required: true },
  landmark: { type: String, required: true },
  pincode: { type: String, required: true },
  city: { type: String, required: true },
  state: { type: String, required: true },
});

const userSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String, required: true },
    verified: { type: Boolean, default: false },
    verificationToken: { type: String },
    addresses: [addressSchema],
    orders: [{ type: Schema.Types.ObjectId, ref: 'Order' }],
  },
  { timestamps: true }
);

export const User = mongoose.model<IUser>('User', userSchema);
export { addressSchema };
