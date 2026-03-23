import { Injectable } from '@nestjs/common';
import { AsyncLocalStorage } from 'async_hooks';
import { eq, SQL } from 'drizzle-orm';

interface TenantStore {
  tenantId: string;
}

@Injectable()
export class TenantContextService {
  private readonly storage = new AsyncLocalStorage<TenantStore>();

  run<T>(tenantId: string, fn: () => T): T {
    return this.storage.run({ tenantId }, fn);
  }

  getCurrentTenantId(): string | undefined {
    return this.storage.getStore()?.tenantId;
  }

  requireTenantId(): string {
    const tenantId = this.getCurrentTenantId();
    if (!tenantId) {
      throw new Error('Tenant context is not set');
    }
    return tenantId;
  }

  /**
   * Returns a Drizzle WHERE condition scoping queries to the current tenant.
   * Usage: db.select().from(orders).where(tenantContext.scopeToTenant(orders))
   */
  scopeToTenant(table: {
    tenant_id: ReturnType<typeof eq> extends SQL ? never : any;
  }): SQL {
    return eq(table.tenant_id, this.requireTenantId());
  }
}
