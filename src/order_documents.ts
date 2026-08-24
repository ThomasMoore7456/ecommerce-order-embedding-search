import { z } from "zod";

export const orderDocumentSchema = z.object({
  id: z.string().min(1),
  orderId: z.string().min(1),
  kind: z.enum(["checkout", "fulfillment", "receipt", "customer_update"]),
  text: z.string().min(1),
  occurredAt: z.string().datetime(),
});

export const indexRequestSchema = z.object({
  documents: z.array(orderDocumentSchema).min(1).max(100),
});

export const searchRequestSchema = z.object({
  query: z.string().min(2),
  limit: z.number().int().min(1).max(10).default(3),
});

export type OrderDocument = z.infer<typeof orderDocumentSchema>;

export type IndexedOrderDocument = OrderDocument & {
  embedding: number[];
};

export type SearchHit = OrderDocument & {
  score: number;
};
