import { Injectable } from '@nestjs/common';
import { AsyncLocalStorage } from 'async_hooks';

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
}
