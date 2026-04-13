import { z } from "zod";
import {
  PRODUCT_TYPES,
  ORDER_STATUSES,
  FULFILMENT_STAGES,
  PAYMENT_PLAN_TEMPLATES,
} from "../constants/commerce";

export const productInsertSchema = z.object({
  canonicalId: z.string().min(1).max(100).regex(/^[a-z0-9-]+$/),
  name: z.string().min(1).max(200),
  category: z.string().min(1).max(100),
  productType: z.enum(PRODUCT_TYPES),
  isActive: z.boolean().optional(),
  materials: z.string().max(500).nullable().optional(),
  sizeRange: z.string().max(200).nullable().optional(),
  includes: z.string().max(500).nullable().optional(),
});

export const priceListInsertSchema = z.object({
  name: z.string().min(1).max(200),
  year: z.number().int().min(2020).max(2099),
  isActive: z.boolean().optional(),
});

export const priceListItemInsertSchema = z.object({
  priceListId: z.string().uuid(),
  productId: z.string().uuid(),
  sizeLabel: z.string().max(100).nullable().optional(),
  priceCents: z.number().int().min(0),
});

export const orderInsertSchema = z.object({
  contactId: z.string().uuid(),
  projectId: z.string().uuid().nullable().optional(),
  status: z.enum(ORDER_STATUSES).optional(),
  totalCents: z.number().int().min(0).optional(),
  subtotalCents: z.number().int().min(0).nullable().optional(),
  gstCents: z.number().int().min(0).nullable().optional(),
  notes: z.string().nullable().optional(),
  createdBy: z.string().uuid().nullable().optional(),
  paidAt: z.coerce.date().nullable().optional(),
  source: z.string().max(100).nullable().optional(),
});

export const orderItemInsertSchema = z.object({
  orderId: z.string().uuid(),
  productId: z.string().uuid().nullable().optional(),
  priceListItemId: z.string().uuid().nullable().optional(),
  description: z.string().min(1).max(500),
  quantity: z.number().int().min(1),
  unitPriceCents: z.number().int().min(0),
  fulfilmentStage: z.enum(FULFILMENT_STAGES).optional(),
  assignedTo: z.string().uuid().nullable().optional(),
  itemType: z.string().max(100).nullable().optional(),
  taxCents: z.number().int().min(0).nullable().optional(),
  images: z.array(z.string()).nullable().optional(),
  fulfilmentNotes: z.string().nullable().optional(),
  extendedPriceCents: z.number().int().min(0).nullable().optional(),
});

export const paymentPlanInsertSchema = z.object({
  orderId: z.string().uuid(),
  templateType: z.enum(PAYMENT_PLAN_TEMPLATES),
});

export const paymentInstalmentInsertSchema = z.object({
  planId: z.string().uuid(),
  label: z.string().min(1).max(200),
  amountCents: z.number().int().min(0),
  dueDate: z.coerce.date(),
  note: z.string().nullable().optional(),
});

export const productUpdateSchema = productInsertSchema.partial();

export const orderUpdateSchema = orderInsertSchema.partial().omit({ contactId: true });

export const orderItemUpdateSchema = orderItemInsertSchema.partial().omit({ orderId: true });

export const paymentInstalmentUpdateSchema = paymentInstalmentInsertSchema.partial().omit({ planId: true });

export type ProductInsert = z.infer<typeof productInsertSchema>;
export type ProductUpdate = z.infer<typeof productUpdateSchema>;
export type PriceListInsert = z.infer<typeof priceListInsertSchema>;
export type PriceListItemInsert = z.infer<typeof priceListItemInsertSchema>;
export type OrderInsert = z.infer<typeof orderInsertSchema>;
export type OrderUpdate = z.infer<typeof orderUpdateSchema>;
export type OrderItemInsert = z.infer<typeof orderItemInsertSchema>;
export type OrderItemUpdate = z.infer<typeof orderItemUpdateSchema>;
export type PaymentPlanInsert = z.infer<typeof paymentPlanInsertSchema>;
export type PaymentInstalmentInsert = z.infer<typeof paymentInstalmentInsertSchema>;
export type PaymentInstalmentUpdate = z.infer<typeof paymentInstalmentUpdateSchema>;
