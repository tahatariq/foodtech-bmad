import { TenantContextService } from './tenant-context.service';

describe('TenantContextService', () => {
  let service: TenantContextService;

  beforeEach(() => {
    service = new TenantContextService();
  });

  it('should return undefined when no tenant context is set', () => {
    expect(service.getCurrentTenantId()).toBeUndefined();
  });

  it('should return tenant ID within a run context', () => {
    const tenantId = 'tenant-123';
    service.run(tenantId, () => {
      expect(service.getCurrentTenantId()).toBe(tenantId);
    });
  });

  it('should throw when requireTenantId is called outside a context', () => {
    expect(() => service.requireTenantId()).toThrow(
      'Tenant context is not set',
    );
  });

  it('should return tenant ID from requireTenantId within context', () => {
    service.run('tenant-456', () => {
      expect(service.requireTenantId()).toBe('tenant-456');
    });
  });

  it('should isolate tenant contexts across nested runs', () => {
    service.run('outer', () => {
      expect(service.getCurrentTenantId()).toBe('outer');
      service.run('inner', () => {
        expect(service.getCurrentTenantId()).toBe('inner');
      });
      expect(service.getCurrentTenantId()).toBe('outer');
    });
  });
});
