import { z } from 'zod';

export const importMenuItemSchema = z.object({
  name: z.string().min(1).max(200),
  category: z.string().max(100).optional(),
  reorderThreshold: z.number().int().min(0).optional(),
  reorderQuantity: z.number().int().min(0).optional(),
});

export const importMenuSchema = z.object({
  items: z.array(importMenuItemSchema).min(1),
});

export type ImportMenuDto = z.infer<typeof importMenuSchema>;
export type ImportMenuItem = z.infer<typeof importMenuItemSchema>;
