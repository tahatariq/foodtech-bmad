import { z } from 'zod';

export const createOrderStagesSchema = z.object({
  stages: z
    .array(
      z.object({
        name: z.string().min(1).max(100),
        sequence: z.number().int().min(0),
      }),
    )
    .min(1),
});

export type CreateOrderStagesDto = z.infer<typeof createOrderStagesSchema>;
