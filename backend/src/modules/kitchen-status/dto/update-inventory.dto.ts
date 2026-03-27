import { z } from 'zod';

export const updateInventorySchema = z.object({
  currentQuantity: z.number().int().min(0).optional(),
  reorderThreshold: z.number().int().min(0).optional(),
});

export type UpdateInventoryDto = z.infer<typeof updateInventorySchema>;
