/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'customer';
  address?: string;
  phone?: string;
  password?: string;
  passwordHash?: string;
  googleId?: string;
  avatar?: string;
  provider?: 'local' | 'google';
  authProvider?: 'local' | 'google';
  emailVerified?: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface PendingVerification {
  id?: string;
  email: string;
  name: string;
  passwordHash: string;
  address?: string;
  phone?: string;
  codeHash: string;
  attempts: number;
  resendCount: number;
  lastResentAt: string;
  expiresAt: string;
  createdAt: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  image: string;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  discountPrice?: number;
  stock: number;
  categoryId: string;
  brand: string;
  images: string[];
  rating: number;
  reviewsCount: number;
  featured: boolean;
  createdAt: string;
}

export interface CartItem {
  productId: string;
  product: Product;
  quantity: number;
}

export interface OrderItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
}

export interface OrderLog {
  date: string;
  action: string;
  user: string;
}

export interface Order {
  id?: string;
  orderNumber: string;
  customerName: string;
  phone: string;
  address: string;
  items: OrderItem[];
  subtotal: number;
  shippingFee: number;
  discount: number;
  total: number;
  status: string;
  deliveryStatus: string;
  createdAt: string;
  updatedAt: string;

  // Compatibility / convenience fields
  userId?: string;
  userName?: string;
  userEmail?: string;
  paymentMethod?: string;
  paymentStatus?: string;
  transactionReference?: string;
  trackingNumber?: string;
  carrier?: string;
  couponCode?: string;
  discountAmount?: number;
  logs?: OrderLog[];
  customerId?: string;
  products?: {
    productId: string;
    name: string;
    priceAtPurchase: number;
    quantity: number;
    price: number;
    image: string;
  }[];
}

export interface Review {
  id: string;
  productId: string;
  userId: string;
  userName: string;
  rating: number;
  comment: string;
  createdAt: string;
}

export interface Coupon {
  id: string;
  code: string;
  type: 'percentage' | 'fixed';
  value: number; // e.g., 20 for 20% or 15 for 15€
  minAmount: number;
  active: boolean;
  expiryDate: string;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  isRead: boolean;
  createdAt: string;
}

export interface Payment {
  id?: string;
  paymentNumber: string;
  orderNumber: string;
  amount: number;
  customerName: string;
  phone: string;
  paymentMethod: 'MVola' | 'Orange Money' | 'Airtel Money' | 'Paiement à la livraison' | string;
  transactionReference?: string;
  receiptImage?: string;
  status: 'À vérifier' | 'Paiement à la livraison' | 'pending' | 'approved' | 'rejected' | string;
  createdAt: string;

  // Compatibility / convenience fields
  orderId?: string;
  userId?: string;
  fullName?: string;
  phoneNumber?: string;
  deliveryAddress?: string;
  paymentReference?: string;
  receiptImages?: {
    url: string;
    publicId: string;
  }[];
  verifiedBy?: string;
  verifiedAt?: string;
  rejectionReason?: string;
  updatedAt?: string;
}

export type MobileMoneyPayment = Payment;

export interface DashboardStats {
  totalSales: number;
  totalOrders: number;
  totalClients: number;
  totalProducts: number;
  salesHistory: { date: string; amount: number }[];
  categorySales: { categoryName: string; count: number }[];
}
