export interface Product {
  id: number;
  title: string;
  price: number;
  description: string;
  category: string;
  image: string;
  rating: { rate: number; count: number };
}

export interface CartItem extends Product {
  quantity: number;
}

export interface Address {
  _id?: string;
  name: string;
  mobile: string;
  houseNo: string;
  street: string;
  landmark: string;
  pincode: string;
  city: string;
  state: string;
}

export interface Order {
  _id: string;
  products: { name: string; quantity: number; price: number; image: string }[];
  totalPrice: number;
  shippingAddress: Address;
  paymentMethod: string;
  status: string;
  createdAt: string;
}

export interface User {
  _id: string;
  name: string;
  email: string;
  verified: boolean;
  addresses: Address[];
}

// Static deal/offer items used on home screen
export interface DealItem {
  id: string;
  title: string;
  price: number;
  oldPrice: number;
  image: string;
  carouselImages: string[];
  color?: string;
  size?: string;
  offer?: string;
}
