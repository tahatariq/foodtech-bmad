import { z } from 'zod';

export const createSupplierLinkSchema = z.object({
  supplierId: z.string().min(1),
  locationId: z.string().min(1),
});

export type CreateSupplierLinkDto = z.infer<typeof createSupplierLinkSchema>;
