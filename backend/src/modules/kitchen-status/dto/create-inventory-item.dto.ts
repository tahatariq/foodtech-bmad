import { z } from 'zod';

export const createInventoryItemSchema = z.object({
  itemName: z.string().min(1).max(100),
  currentQuantity: z.number().int().min(0),
  reorderThreshold: z.number().int().min(0),
});

export type CreateInventoryItemDto = z.infer<typeof createInventoryItemSchema>;
