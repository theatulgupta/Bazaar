declare module 'react-native-razorpay' {
  type CheckoutOptions = {
    key: string;
    amount: number;
    currency: string;
    name: string;
    description?: string;
    order_id: string;
    prefill?: { email?: string; contact?: string; name?: string };
    theme?: { color?: string };
  };
  const RazorpayCheckout: {
    open(options: CheckoutOptions): Promise<{ razorpay_payment_id: string }>;
  };
  export default RazorpayCheckout;
}
