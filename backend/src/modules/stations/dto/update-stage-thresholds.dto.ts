import { z } from 'zod';

export const updateStageThresholdsSchema = z.object({
  warningThresholdMinutes: z.number().int().min(1).max(60).optional(),
  criticalThresholdMinutes: z.number().int().min(1).max(120).optional(),
});

export type UpdateStageThresholdsDto = z.infer<
  typeof updateStageThresholdsSchema
>;
