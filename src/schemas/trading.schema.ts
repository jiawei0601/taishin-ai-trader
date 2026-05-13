import { z } from 'zod';

export const StockQuoteSchema = z.object({
  symbol: z.string(),
  name: z.string().optional(),
  lastPrice: z.number(),
  change: z.number(),
  volume: z.number(),
  timestamp: z.number(),
});

export type StockQuote = z.infer<typeof StockQuoteSchema>;

export const OrderResponseSchema = z.object({
  orderId: z.string(),
  status: z.enum(['PENDING', 'FILLED', 'CANCELLED', 'REJECTED']),
  symbol: z.string(),
  price: z.number(),
  quantity: z.number(),
});

export type OrderResponse = z.infer<typeof OrderResponseSchema>;
