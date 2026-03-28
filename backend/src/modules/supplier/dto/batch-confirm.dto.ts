import { z } from 'zod';

export const batchConfirmSchema = z.object({
  orderIds: z.array(z.string().uuid()).min(1),
});

export type BatchConfirmDto = z.infer<typeof batchConfirmSchema>;
