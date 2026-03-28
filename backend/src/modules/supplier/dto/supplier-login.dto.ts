import { z } from 'zod';

export const supplierLoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export type SupplierLoginDto = z.infer<typeof supplierLoginSchema>;
