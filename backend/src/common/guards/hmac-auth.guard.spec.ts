import { UnauthorizedException } from '@nestjs/common';
import { HmacAuthGuard } from './hmac-auth.guard';
import { createHash, createHmac } from 'crypto';

describe('HmacAuthGuard', () => {
  let guard: HmacAuthGuard;
  let mockApiKeysService: {
    validateApiKey: jest.Mock;
  };

  const testApiKey = 'ft_key_abc123';
  const testSecret = 'test-secret-hash';
  const testTenantId = 'tenant-1';

  beforeEach(() => {
    mockApiKeysService = {
      validateApiKey: jest.fn(),
    };

    guard = new HmacAuthGuard(mockApiKeysService as never);
  });

  function createContext(headers: Record<string, string>, body: unknown = {}) {
    const request = {
      headers,
      body,
    };

    return {
      switchToHttp: () => ({
        getRequest: () => request,
      }),
    } as unknown as import('@nestjs/common').ExecutionContext;
  }

  it('should pass with valid API key and signature', async () => {
    const body = JSON.stringify({ data: 'test' });
    const expectedSignature = createHmac('sha256', testSecret)
      .update(body)
      .digest('hex');

    mockApiKeysService.validateApiKey.mockResolvedValue({
      id: 'key-1',
      tenant_id: testTenantId,
      secret_hash: testSecret,
      is_active: true,
    });

    const context = createContext(
      {
        'x-foodtech-key': testApiKey,
        'x-foodtech-signature': expectedSignature,
      },
      { data: 'test' },
    );

    const result = await guard.canActivate(context);
    expect(result).toBe(true);

    const keyHash = createHash('sha256').update(testApiKey).digest('hex');
    expect(mockApiKeysService.validateApiKey).toHaveBeenCalledWith(keyHash);
  });

  it('should throw UnauthorizedException when API key is missing', async () => {
    const context = createContext({
      'x-foodtech-signature': 'some-sig',
    });

    await expect(guard.canActivate(context)).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('should throw UnauthorizedException when signature is missing', async () => {
    const context = createContext({
      'x-foodtech-key': testApiKey,
    });

    await expect(guard.canActivate(context)).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('should throw UnauthorizedException for invalid API key', async () => {
    mockApiKeysService.validateApiKey.mockResolvedValue(null);

    const context = createContext({
      'x-foodtech-key': 'invalid-key',
      'x-foodtech-signature': 'some-sig',
    });

    await expect(guard.canActivate(context)).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('should throw UnauthorizedException for invalid signature', async () => {
    mockApiKeysService.validateApiKey.mockResolvedValue({
      id: 'key-1',
      tenant_id: testTenantId,
      secret_hash: testSecret,
      is_active: true,
    });

    const context = createContext(
      {
        'x-foodtech-key': testApiKey,
        'x-foodtech-signature': 'wrong-signature',
      },
      { data: 'test' },
    );

    await expect(guard.canActivate(context)).rejects.toThrow(
      UnauthorizedException,
    );
  });
});
