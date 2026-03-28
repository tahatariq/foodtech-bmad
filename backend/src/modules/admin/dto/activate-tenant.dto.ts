import { z } from 'zod';

export const activateTenantSchema = z.object({
  stations: z
    .array(
      z.object({
        name: z.string().min(1).max(100),
        emoji: z.string().max(10).optional(),
      }),
    )
    .min(1),
  stages: z
    .array(
      z.object({
        name: z.string().min(1).max(100),
        sequence: z.number().int().min(0),
      }),
    )
    .min(1),
});

export type ActivateTenantDto = z.infer<typeof activateTenantSchema>;
