/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type UserRole = "Administrateur" | "Analyste";
export type UserStatus = "Actif" | "Inactif";

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  lastLogin: string;
}

export interface Promotion {
  type: "percentage" | "fixed";
  value: number;
  active: boolean;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  image?: string;
}

export interface Product {
  id: string;
  name: string;
  slug?: string;
  description?: string;
  category: string; // for compatibility
  categoryId: string; // "cat_1", etc.
  brand: string;
  sku: string;
  originalPrice: number; // for compatibility, alias for price
  currentPrice: number; // for compatibility, alias for discountPrice / price
  price: number; // new field
  discountPrice?: number; // new field
  stock: number;
  sourceUrl: string;
  lastCollected: string;
  images: string[];
  status: "Publié" | "Brouillon";
  promotion: Promotion | null;
  minStockThreshold: number;
  rating?: number;
  reviewsCount?: number;
  featured?: boolean;
  createdAt?: string;

  // Meta Graph API & AI Marketing Automation fields
  facebook_publication_status?: "pending" | "generating" | "publishing" | "published" | "failed" | "disabled";
  facebook_post_id?: string;
  facebook_post_content?: string;
  facebook_published_at?: string;
  facebook_error?: string;
  facebook_attempts?: number;
  facebook_is_simulated?: boolean;
  facebook_page_id?: string;

  // Facebook Story Automation fields
  facebook_story_status?: "pending" | "generating" | "publishing" | "published" | "failed" | "disabled";
  facebook_story_id?: string;
  facebook_story_image_url?: string;
  facebook_story_published_at?: string;
  facebook_story_error?: string;
}

export interface ActivityLog {
  id: string;
  username: string;
  role: string;
  action: string;
  ip: string;
  timestamp: string;
  type: "auth" | "crud" | "system";
}

export interface SystemSettings {
  mongoUri: string;
  nodeApiUrl: string;
  automaticAlertsEnabled: boolean;
  facebookAutoPublishEnabled?: boolean;
  facebookAutoStoryEnabled?: boolean;
  whatsappAutoReplyEnabled?: boolean;
  whatsappCustomerServicePrompt?: string;
  websiteUrl?: string;
  whatsappNumber?: string;
  facebookPageId?: string;
  facebookPageName?: string;
  metaAppId?: string;
  metaAppSecret?: string;
  metaPageAccessToken?: string;

  // Email Notification & SMTP Settings
  emailNotificationsEnabled?: boolean;
  emailSmtpHost?: string;
  emailSmtpPort?: number;
  emailSmtpUser?: string;
  emailSmtpPassword?: string;
  emailSmtpSecure?: boolean;
  emailSenderName?: string;
  emailSenderAddress?: string;
  emailSupportContact?: string;
  storeName?: string;
}

// ==========================================
// NEW BUSINESS MODULE INTERFACES
// ==========================================

export interface Customer {
  id: string;
  lastName: string;
  firstName: string;
  address: string;
  phone: string;
  email: string;
  orderCount: number;
  totalSpend: number;
  registrationDate: string;
  lastLoginDate: string;
  status: "Actif" | "Bloqué";
}

export interface OrderItem {
  productId: string;
  name: string;
  quantity: number;
  priceAtPurchase: number;
  price?: number;
  image?: string;
}

export interface OrderLog {
  date: string;
  action: string;
  user: string;
}

export interface Order {
  id: string;
  customerId: string;
  customerName: string;
  products: OrderItem[];
  totalAmount: number;
  paymentStatus: string;
  deliveryStatus: string;
  orderDate: string;
  paymentMethod: string;
  
  address?: string;
  couponCode?: string | null;
  createdAt?: string;
  discountAmount?: number | null;
  items?: OrderItem[];
  logs?: OrderLog[];
  orderNumber?: string;
  phone?: string;
  shippingFee?: number;
  status?: string;
  subtotal?: number;
  total?: number;
  transactionReference?: string;
  trackingNumber?: string;
  carrier?: string;
  whatsappMessage?: string;
  whatsappReplyGeneratedAt?: string;
  whatsappStatus?: "generated" | "sent" | "pending";
  
  // Automated Email Confirmation Tracking
  emailSent?: boolean;
  emailSentAt?: string;
  emailStatus?: "sent" | "failed" | "pending";
  emailContentHtml?: string;
  emailContentText?: string;
  emailError?: string;
  emailRecipient?: string;
  emailAiMessage?: string;

  // Automated Payment Receipt Email Tracking
  paymentEmailSent?: boolean;
  paymentEmailSentAt?: string;
  paymentEmailStatus?: "sent" | "failed" | "pending";
  paymentEmailRecipient?: string;
  paymentEmailError?: string;
  paymentEmailAiMessage?: string;

  updatedAt?: string;
  email?: string;
  userEmail?: string;
  userId?: string;
  userName?: string;
}

export interface StockMovement {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  type: "Entrée" | "Sortie";
  userResponsible: string;
  date: string;
  comment: string;
}

export interface MobileMoneyPayment {
  id: string;
  reference: string;
  customerName: string;
  phone: string;
  deliveryAddress: string;
  orderId: string;
  amount: number;
  provider: "MVola" | "Airtel Money" | "Orange Money";
  sentAt: string;
  status: "pending" | "approved" | "rejected";
  rejectionReason?: string;
  verifiedBy?: string;
  verifiedAt?: string;
  proofs: string[];
}

