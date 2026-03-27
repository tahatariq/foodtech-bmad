import { z } from 'zod';

export const createOrderSchema = z.object({
  orderNumber: z.string().min(1).max(100),
  items: z
    .array(
      z.object({
        itemName: z.string().min(1).max(200),
        stationId: z.string().uuid(),
        quantity: z.number().int().min(1),
      }),
    )
    .min(1),
});

export type CreateOrderDto = z.infer<typeof createOrderSchema>;
