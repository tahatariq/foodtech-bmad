import { z } from 'zod';

export const createWebhookSchema = z.object({
  url: z.string().url(),
  events: z.array(z.string()).min(1),
});

export type CreateWebhookDto = z.infer<typeof createWebhookSchema>;
