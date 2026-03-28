import { z } from 'zod';

export const batchRouteSchema = z.object({
  groups: z
    .array(
      z.object({
        orderIds: z.array(z.string().uuid()).min(1),
        deliveryTime: z.string(),
      }),
    )
    .min(1),
});

export type BatchRouteDto = z.infer<typeof batchRouteSchema>;
