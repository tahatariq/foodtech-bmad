import { z } from 'zod';

export const createChecklistSchema = z.object({
  stationId: z.string().uuid(),
  name: z.string().min(1).max(100),
  items: z
    .array(z.object({ description: z.string().min(1).max(200) }))
    .min(1)
    .optional(),
});

export type CreateChecklistDto = z.infer<typeof createChecklistSchema>;

export const addChecklistItemSchema = z.object({
  description: z.string().min(1).max(200),
});

export type AddChecklistItemDto = z.infer<typeof addChecklistItemSchema>;

export const toggleChecklistItemSchema = z.object({
  isCompleted: z.boolean(),
});

export type ToggleChecklistItemDto = z.infer<typeof toggleChecklistItemSchema>;
