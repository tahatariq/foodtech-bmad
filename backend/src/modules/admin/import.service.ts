import { Inject, Injectable } from '@nestjs/common';
import { DRIZZLE, type DrizzleDB } from '../../database/database.provider';
import { inventoryItems } from '../../database/schema/inventory.schema';
import {
  importMenuItemSchema,
  type ImportMenuItem,
} from './dto/import-menu.dto';

@Injectable()
export class ImportService {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDB) {}

  validateMenuItems(items: unknown[]) {
    const valid: ImportMenuItem[] = [];
    const invalid: { index: number; errors: string[] }[] = [];

    items.forEach((item, index) => {
      const result = importMenuItemSchema.safeParse(item);
      if (result.success) {
        valid.push(result.data);
      } else {
        invalid.push({
          index,
          errors: result.error.issues.map(
            (e) => `${e.path.join('.')}: ${e.message}`,
          ),
        });
      }
    });

    return { valid, invalid };
  }

  async executeImport(tenantId: string, items: ImportMenuItem[]) {
    let imported = 0;
    let skipped = 0;

    for (const item of items) {
      try {
        await this.db
          .insert(inventoryItems)
          .values({
            item_name: item.name,
            current_quantity: 0,
            reorder_threshold: item.reorderThreshold ?? 0,
            reorder_quantity: item.reorderQuantity ?? 0,
            tenant_id: tenantId,
          })
          .onConflictDoNothing();
        imported++;
      } catch {
        skipped++;
      }
    }

    return { imported, skipped };
  }
}
