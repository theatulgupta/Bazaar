import { z } from 'zod';

export const orderStatusSchema = z.enum([
  'payment_pending',
  'paid',
  'confirmed',
  'shipped',
  'delivered',
  'payment_failed',
  'cancelled',
]);
export type OrderStatus = z.infer<typeof orderStatusSchema>;

export const addressInputSchema = z.object({
  name: z.string().trim().min(2).max(80),
  mobile: z.string().regex(/^[6-9]\d{9}$/, 'Enter a 10-digit Indian mobile number'),
  houseNo: z.string().trim().min(1).max(40),
  street: z.string().trim().min(1).max(120),
  landmark: z.string().trim().min(1).max(120),
  pincode: z.string().regex(/^\d{6}$/, 'Enter a 6-digit pincode'),
  city: z.string().trim().min(1).max(60),
  state: z.string().trim().min(1).max(60),
});
export type AddressInput = z.infer<typeof addressInputSchema>;

export const addressSchema = addressInputSchema.extend({
  id: z.string().uuid(),
  isDefault: z.boolean(),
});
export type Address = z.infer<typeof addressSchema>;

export const registerSchema = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.string().trim().email(),
  password: z.string().min(8).max(72),
});
export type RegisterInput = z.infer<typeof registerSchema>;

export const loginSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(1),
});
export type LoginInput = z.infer<typeof loginSchema>;

export const refreshSchema = z.object({
  refreshToken: z.string().min(20).optional(),
});

export const authTokensSchema = z.object({
  accessToken: z.string(),
  refreshToken: z.string(),
  expiresIn: z.string(),
});

export const userSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  email: z.string().email(),
  role: z.enum(['CUSTOMER', 'ADMIN']),
  emailVerified: z.boolean(),
});
export type UserProfile = z.infer<typeof userSchema>;

export const categorySchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  slug: z.string(),
});
export type Category = z.infer<typeof categorySchema>;

export const productSchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
  slug: z.string(),
  description: z.string(),
  categorySlug: z.string(),
  categoryName: z.string(),
  pricePaise: z.number().int(),
  mrpPaise: z.number().int(),
  imageUrl: z.string().url(),
  active: z.boolean(),
  available: z.number().int().optional(),
});
export type Product = z.infer<typeof productSchema>;

export const productPageSchema = z.object({
  items: z.array(productSchema),
  page: z.number().int(),
  pageSize: z.number().int(),
  total: z.number().int(),
});

export const cartItemInputSchema = z.object({
  productId: z.string().uuid(),
  quantity: z.number().int().positive().max(10),
});

export const mergeCartSchema = z.object({
  items: z.array(cartItemInputSchema).max(50),
});

export const cartLineSchema = z.object({
  productId: z.string().uuid(),
  quantity: z.number().int(),
  title: z.string(),
  slug: z.string(),
  imageUrl: z.string(),
  unitPricePaise: z.number().int(),
  available: z.number().int(),
});
export type CartLine = z.infer<typeof cartLineSchema>;

export const cartSchema = z.object({
  items: z.array(cartLineSchema),
});

export const quoteLineSchema = cartLineSchema.extend({
  lineTotalPaise: z.number().int(),
  purchasable: z.boolean(),
});

export const quoteSchema = z.object({
  lines: z.array(quoteLineSchema),
  subtotalPaise: z.number().int(),
  shippingPaise: z.number().int(),
  totalPaise: z.number().int(),
});
export type Quote = z.infer<typeof quoteSchema>;

export const placeOrderSchema = z.object({
  addressId: z.string().uuid(),
});

export const checkoutResultSchema = z.object({
  orderId: z.string().uuid(),
  orderNumber: z.string(),
  razorpayOrderId: z.string(),
  amountPaise: z.number().int(),
  currency: z.literal('INR'),
  keyId: z.string(),
});
export type CheckoutResult = z.infer<typeof checkoutResultSchema>;

export const orderItemSchema = z.object({
  productId: z.string().uuid(),
  title: z.string(),
  unitPricePaise: z.number().int(),
  quantity: z.number().int(),
});

export const orderSchema = z.object({
  id: z.string().uuid(),
  number: z.string(),
  status: orderStatusSchema,
  subtotalPaise: z.number().int(),
  shippingPaise: z.number().int(),
  totalPaise: z.number().int(),
  items: z.array(orderItemSchema),
  address: addressInputSchema,
  createdAt: z.string(),
});
export type Order = z.infer<typeof orderSchema>;

export const createProductSchema = z
  .object({
    title: z.string().trim().min(3).max(160),
    description: z.string().trim().min(10).max(4000),
    categorySlug: z.string().trim().min(1),
    pricePaise: z.number().int().positive(),
    mrpPaise: z.number().int().positive(),
    imageUrl: z.string().url(),
    stock: z.number().int().nonnegative(),
    active: z.boolean().default(true),
  })
  .refine((value) => value.mrpPaise >= value.pricePaise, {
    message: 'MRP must be greater than or equal to the selling price',
    path: ['mrpPaise'],
  });
export type CreateProductInput = z.infer<typeof createProductSchema>;

export const updateProductSchema = z.object({
  title: z.string().trim().min(3).max(160).optional(),
  description: z.string().trim().min(10).max(4000).optional(),
  pricePaise: z.number().int().positive().optional(),
  mrpPaise: z.number().int().positive().optional(),
  imageUrl: z.string().url().optional(),
  active: z.boolean().optional(),
});

export const setStockSchema = z.object({
  onHand: z.number().int().nonnegative(),
});

export const stockSchema = z.object({
  productId: z.string().uuid(),
  onHand: z.number().int(),
  reserved: z.number().int(),
  available: z.number().int(),
});

export const transitionSchema = z.object({
  status: z.enum(['confirmed', 'shipped', 'delivered', 'cancelled']),
});

export const paymentViewSchema = z.object({
  orderId: z.string().uuid(),
  status: z.enum(['created', 'captured', 'failed']),
  amountPaise: z.number().int(),
  currency: z.string(),
  razorpayOrderId: z.string().nullable(),
  razorpayPaymentId: z.string().nullable(),
});

export const auditEntrySchema = z.object({
  id: z.string().uuid(),
  actorId: z.string().uuid().nullable(),
  action: z.string(),
  entityType: z.string(),
  entityId: z.string(),
  metadata: z.record(z.unknown()),
  createdAt: z.string(),
});

export const apiErrorSchema = z.object({
  error: z.object({
    code: z.string(),
    message: z.string(),
  }),
});
