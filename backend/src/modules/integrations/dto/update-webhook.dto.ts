import { z } from 'zod';

export const updateWebhookSchema = z.object({
  url: z.string().url().optional(),
  events: z.array(z.string()).min(1).optional(),
});

export type UpdateWebhookDto = z.infer<typeof updateWebhookSchema>;
