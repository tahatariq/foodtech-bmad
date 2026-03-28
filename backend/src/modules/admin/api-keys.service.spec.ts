import { NotFoundException } from '@nestjs/common';
import { ApiKeysService } from './api-keys.service';

describe('ApiKeysService', () => {
  let service: ApiKeysService;
  let mockDb: {
    insert: jest.Mock;
    select: jest.Mock;
    update: jest.Mock;
  };

  beforeEach(() => {
    mockDb = {
      insert: jest.fn().mockReturnValue({
        values: jest.fn().mockReturnValue({
          returning: jest.fn().mockResolvedValue([
            {
              id: 'key-1',
              tenant_id: 'tenant-1',
              key_prefix: 'ft_key_abcd',
              key_hash: 'hashed-key',
              secret_hash: 'hashed-secret',
              is_active: true,
              created_at: new Date(),
            },
          ]),
        }),
      }),
      select: jest.fn().mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([
            {
              id: 'key-1',
              key_prefix: 'ft_key_abcd',
              is_active: true,
              created_at: new Date(),
              revoked_at: null,
            },
          ]),
        }),
      }),
      update: jest.fn().mockReturnValue({
        set: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            returning: jest.fn().mockResolvedValue([
              {
                id: 'key-1',
                is_active: false,
                revoked_at: new Date(),
              },
            ]),
          }),
        }),
      }),
    };

    service = new ApiKeysService(mockDb as never);
  });

  it('should generate key pair with ft_key_ prefix', async () => {
    const result = await service.generateKeyPair('tenant-1');

    expect(result.key).toMatch(/^ft_key_/);
    expect(result.id).toBe('key-1');
    expect(result.webhookUrl).toContain('tenant-1');
  });

  it('should generate key with 32+ chars', async () => {
    const result = await service.generateKeyPair('tenant-1');

    // ft_key_ (7) + 32 hex chars = 39 chars total
    expect(result.key.length).toBeGreaterThanOrEqual(32);
  });

  it('should generate secret with 64 hex chars', async () => {
    const result = await service.generateKeyPair('tenant-1');

    expect(result.secret).toHaveLength(64);
    expect(result.secret).toMatch(/^[0-9a-f]+$/);
  });

  it('should list keys without secrets', async () => {
    const result = await service.listKeys('tenant-1');

    expect(result).toHaveLength(1);
    expect(result[0].key_prefix).toBe('ft_key_abcd');
    // Verify no secret or key_hash in returned data
    const item = result[0] as Record<string, unknown>;
    expect(item['secret_hash']).toBeUndefined();
    expect(item['key_hash']).toBeUndefined();
  });

  it('should revoke key by setting is_active to false', async () => {
    const result = await service.revokeKey('key-1');

    expect(result.id).toBe('key-1');
    expect(result.revoked).toBe(true);
  });

  it('should throw NotFoundException when revoking non-existent key', async () => {
    mockDb.update.mockReturnValue({
      set: jest.fn().mockReturnValue({
        where: jest.fn().mockReturnValue({
          returning: jest.fn().mockResolvedValue([]),
        }),
      }),
    });

    await expect(service.revokeKey('nonexistent')).rejects.toThrow(
      NotFoundException,
    );
  });
});
