// Enums from PDF
export enum Role {
  GUEST = 'GUEST',
  CUSTOMER = 'CUSTOMER',
  STAFF = 'STAFF',
  ADMIN = 'ADMIN',
}

export enum OrderStatus {
  PENDING = 'PENDING',       // Initial state
  CONFIRMED = 'CONFIRMED',   // Staff approved, stock deducted
  COMPLETED = 'COMPLETED',   // Delivered
  CANCELLED = 'CANCELLED',   // Cancelled by user or staff
}

// Entities
export interface User {
  id: string;
  fullName: string;
  email: string;
  role: Role;
  addresses: Address[];
}

export interface Address {
  id: string;
  userId: string;
  recipientName: string;
  phone: string;
  addressLine: string;
  city: string;
  isDefault: boolean;
}

export interface Variant {
  id: string;
  productId: string;
  name: string; // e.g., "128GB - Midnight Black"
  color: string;
  capacity: string;
  price: number;
  stockQuantity: number;
  imageUrl?: string;
}

export interface Product {
  id: string;
  name: string;
  brand: string;
  description: string;
  variants: Variant[];
}

export interface CartItem {
  id: string;
  variantId: string;
  productName: string;
  variantName: string;
  price: number;
  quantity: number;
  imageUrl?: string;
}

export interface OrderItem {
  id: string;
  variantId: string;
  productName: string;
  variantName: string;
  price: number;
  quantity: number;
}

export interface StaffNote {
  id: string;
  content: string;
  createdAt: string;
  authorName: string;
}

export interface Order {
  id: string;
  userId: string;
  customerName: string;
  items: OrderItem[];
  totalAmount: number;
  status: OrderStatus;
  shippingAddress: string; // Snapshot of address
  createdAt: string;
  notes: StaffNote[]; // Internal staff notes
}

export interface InventoryTx {
  id: string;
  variantId: string;
  qtyChange: number; // Negative for order, positive for restock
  reason: string;
  date: string;
}