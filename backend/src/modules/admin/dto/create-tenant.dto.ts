import { z } from 'zod';

export const createTenantSchema = z.object({
  name: z.string().min(1).max(200),
  tier: z.enum(['indie', 'growth', 'enterprise']),
});

export type CreateTenantDto = z.infer<typeof createTenantSchema>;
