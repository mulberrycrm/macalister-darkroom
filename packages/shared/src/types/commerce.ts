export type ProductType =
  | "print"
  | "digital"
  | "album"
  | "wall_art"
  | "package"
  | "service"
  | "single"
  | "other";

export type OrderStatus = "draft" | "pending" | "partially_paid" | "paid" | "cancelled" | "refunded";

export type FulfilmentStage =
  | "not_started"
  | "retouching"
  | "client_review"
  | "revisions"
  | "approved"
  | "lab_ordered"
  | "in_production"
  | "shipped"
  | "delivered";

export type PaymentPlanTemplate = "portrait_50_50" | "portrait_quarterly" | "wedding_standard" | "custom";

export type PaymentPlanStatus = "active" | "completed" | "cancelled" | "paused";

export type InstalmentStatus = "scheduled" | "processing" | "paid" | "failed" | "cancelled" | "skipped";

export interface Product {
  id: string;
  tenantId: string;
  canonicalId: string;
  name: string;
  category: string;
  productType: ProductType;
  isActive: boolean;
  materials: string | null;
  sizeRange: string | null;
  includes: string | null;
  createdAt: Date;
}

export interface PriceList {
  id: string;
  tenantId: string;
  name: string;
  year: number;
  isActive: boolean;
  createdAt: Date;
}

export interface PriceListItem {
  id: string;
  priceListId: string;
  productId: string;
  sizeLabel: string | null;
  priceCents: number;
}

export interface Order {
  id: string;
  tenantId: string;
  contactId: string;
  projectId: string | null;
  status: OrderStatus;
  totalCents: number;
  subtotalCents: number | null;
  gstCents: number | null;
  notes: string | null;
  createdBy: string | null;
  paidAt: Date | null;
  source: string | null;
  createdAt: Date;
}

export interface OrderItem {
  id: string;
  orderId: string;
  productId: string | null;
  priceListItemId: string | null;
  description: string;
  quantity: number;
  unitPriceCents: number;
  fulfilmentStage: FulfilmentStage;
  assignedTo: string | null;
  itemType: string | null;
  taxCents: number | null;
  images: string[] | null;
  fulfilmentNotes: string | null;
  extendedPriceCents: number | null;
  createdAt: Date;
}

export interface FulfilmentHistory {
  id: string;
  itemId: string;
  fromStage: FulfilmentStage;
  toStage: FulfilmentStage;
  performedBy: string | null;
  note: string | null;
  createdAt: Date;
}

export interface PaymentPlan {
  id: string;
  orderId: string;
  templateType: PaymentPlanTemplate;
  status: PaymentPlanStatus;
  createdAt: Date;
}

export interface PaymentInstalment {
  id: string;
  planId: string;
  label: string;
  amountCents: number;
  dueDate: Date;
  status: InstalmentStatus;
  stripePaymentIntentId: string | null;
  paidAt: Date | null;
  failureReason: string | null;
  attempts: number;
  note: string | null;
}
