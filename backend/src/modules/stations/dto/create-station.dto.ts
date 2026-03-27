import { z } from 'zod';

export const createStationSchema = z.object({
  name: z.string().min(1).max(100),
  emoji: z.string().max(4).optional(),
  displayOrder: z.number().int().min(0),
});

export type CreateStationDto = z.infer<typeof createStationSchema>;
