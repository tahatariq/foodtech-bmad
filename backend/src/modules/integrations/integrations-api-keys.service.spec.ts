import { NotFoundException } from '@nestjs/common';
import { IntegrationsApiKeysService } from './integrations-api-keys.service';

describe('IntegrationsApiKeysService', () => {
  let service: IntegrationsApiKeysService;
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
              key_prefix: 'ft_key_abcde',
              key_hash: 'hashed-key',
              secret_hash: 'hashed-secret',
              is_active: true,
              grace_period_until: null,
              revoked_at: null,
              created_at: new Date('2025-01-01'),
            },
          ]),
        }),
      }),
      select: jest.fn().mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([]),
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

    service = new IntegrationsApiKeysService(mockDb as never);
  });

  // ── generateKeyPair ─────────────────────────────────────────────

  it('should generate a key pair and return raw key and secret', async () => {
    const result = await service.generateKeyPair('tenant-1');

    expect(result.id).toBe('key-1');
    expect(result.key).toMatch(/^ft_key_[0-9a-f]{32}$/);
    expect(result.secret).toMatch(/^[0-9a-f]{64}$/);
    expect(result.keyPrefix).toHaveLength(12);
    expect(result.keyPrefix).toBe(result.key.slice(0, 12));
    expect(result.created_at).toBeDefined();
    expect(mockDb.insert).toHaveBeenCalled();
  });

  it('should generate unique keys on each call', async () => {
    const result1 = await service.generateKeyPair('tenant-1');
    const result2 = await service.generateKeyPair('tenant-1');

    // Keys should differ between calls (different randomBytes)
    expect(result1.key).not.toBe(result2.key);
    expect(result1.secret).not.toBe(result2.secret);
  });

  it('should hash the key before storing', async () => {
    await service.generateKeyPair('tenant-1');

    const insertCall = mockDb.insert.mock.results[0].value;
    const valuesCall = insertCall.values.mock.calls[0][0];

    // key_hash and secret_hash should be SHA-256 hex (64 chars)
    expect(valuesCall.key_hash).toMatch(/^[0-9a-f]{64}$/);
    expect(valuesCall.secret_hash).toMatch(/^[0-9a-f]{64}$/);
    expect(valuesCall.tenant_id).toBe('tenant-1');
    expect(valuesCall.key_prefix).toHaveLength(12);
  });

  // ── listKeys ────────────────────────────────────────────────────

  it('should list keys for a tenant', async () => {
    const keys = [
      {
        id: 'key-1',
        key_prefix: 'ft_key_abcde',
        is_active: true,
        grace_period_until: null,
        created_at: new Date(),
        revoked_at: null,
      },
      {
        id: 'key-2',
        key_prefix: 'ft_key_fghij',
        is_active: false,
        grace_period_until: new Date(),
        created_at: new Date(),
        revoked_at: new Date(),
      },
    ];

    mockDb.select.mockReturnValue({
      from: jest.fn().mockReturnValue({
        where: jest.fn().mockResolvedValue(keys),
      }),
    });

    const result = await service.listKeys('tenant-1');
    expect(result).toHaveLength(2);
    expect(result[0].id).toBe('key-1');
    expect(result[1].is_active).toBe(false);
  });

  it('should return empty array when tenant has no keys', async () => {
    const result = await service.listKeys('tenant-no-keys');
    expect(result).toEqual([]);
  });

  // ── revokeKey ───────────────────────────────────────────────────

  it('should revoke an active key', async () => {
    const result = await service.revokeKey('key-1');

    expect(result.id).toBe('key-1');
    expect(result.revoked).toBe(true);
    expect(mockDb.update).toHaveBeenCalled();
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

  it('should throw NotFoundException when revoking already-revoked key', async () => {
    mockDb.update.mockReturnValue({
      set: jest.fn().mockReturnValue({
        where: jest.fn().mockReturnValue({
          returning: jest.fn().mockResolvedValue([]),
        }),
      }),
    });

    await expect(service.revokeKey('already-revoked')).rejects.toThrow(
      NotFoundException,
    );
  });

  // ── rotateKey ───────────────────────────────────────────────────

  it('should rotate key: deactivate old with grace period, generate new', async () => {
    const existingKey = {
      id: 'key-1',
      tenant_id: 'tenant-1',
      key_prefix: 'ft_key_old12',
      key_hash: 'old-hash',
      secret_hash: 'old-secret-hash',
      is_active: true,
      grace_period_until: null,
      revoked_at: null,
      created_at: new Date(),
    };

    mockDb.select.mockReturnValue({
      from: jest.fn().mockReturnValue({
        where: jest.fn().mockResolvedValue([existingKey]),
      }),
    });

    // update mock for setting grace period
    mockDb.update.mockReturnValue({
      set: jest.fn().mockReturnValue({
        where: jest.fn().mockResolvedValue(undefined),
      }),
    });

    const result = await service.rotateKey('key-1', 'tenant-1');

    expect(result.id).toBe('key-1'); // from insert mock
    expect(result.key).toMatch(/^ft_key_/);
    expect(result.secret).toBeDefined();
    // Old key should be updated (deactivated with grace period)
    expect(mockDb.update).toHaveBeenCalled();
    // New key should be inserted
    expect(mockDb.insert).toHaveBeenCalled();
  });

  it('should throw NotFoundException when rotating non-existent key', async () => {
    mockDb.select.mockReturnValue({
      from: jest.fn().mockReturnValue({
        where: jest.fn().mockResolvedValue([]),
      }),
    });

    await expect(service.rotateKey('nonexistent', 'tenant-1')).rejects.toThrow(
      NotFoundException,
    );
  });

  it('should throw NotFoundException when rotating already-revoked key', async () => {
    mockDb.select.mockReturnValue({
      from: jest.fn().mockReturnValue({
        where: jest.fn().mockResolvedValue([]),
      }),
    });

    await expect(service.rotateKey('revoked-key', 'tenant-1')).rejects.toThrow(
      NotFoundException,
    );
  });

  // ── validateApiKey ──────────────────────────────────────────────

  it('should return key when active key matches hash', async () => {
    const activeKey = {
      id: 'key-1',
      tenant_id: 'tenant-1',
      key_prefix: 'ft_key_abc',
      key_hash: 'matching-hash',
      secret_hash: 'secret-hash',
      is_active: true,
      grace_period_until: null,
      revoked_at: null,
      created_at: new Date(),
    };

    mockDb.select.mockReturnValue({
      from: jest.fn().mockReturnValue({
        where: jest.fn().mockResolvedValue([activeKey]),
      }),
    });

    const result = await service.validateApiKey('matching-hash');
    expect(result).toEqual(activeKey);
  });

  it('should return null when no key matches', async () => {
    const result = await service.validateApiKey('no-match-hash');
    expect(result).toBeNull();
  });

  it('should return key during grace period even if revoked', async () => {
    const gracePeriodKey = {
      id: 'key-1',
      tenant_id: 'tenant-1',
      key_prefix: 'ft_key_abc',
      key_hash: 'grace-hash',
      secret_hash: 'secret-hash',
      is_active: false,
      grace_period_until: new Date(Date.now() + 3600_000), // 1h from now
      revoked_at: new Date(),
      created_at: new Date(),
    };

    mockDb.select.mockReturnValue({
      from: jest.fn().mockReturnValue({
        where: jest.fn().mockResolvedValue([gracePeriodKey]),
      }),
    });

    const result = await service.validateApiKey('grace-hash');
    expect(result).toEqual(gracePeriodKey);
    expect(result.is_active).toBe(false);
    expect(result.grace_period_until).toBeDefined();
  });

  it('should return null for expired grace period key', async () => {
    // DB query filters by grace_period_until > now, so expired key won't be returned
    mockDb.select.mockReturnValue({
      from: jest.fn().mockReturnValue({
        where: jest.fn().mockResolvedValue([]),
      }),
    });

    const result = await service.validateApiKey('expired-grace-hash');
    expect(result).toBeNull();
  });
});
