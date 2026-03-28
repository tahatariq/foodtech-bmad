import { WebhookDeliveryService } from './webhook-delivery.service';

// Mock global fetch
const mockFetch = jest.fn();
global.fetch = mockFetch;

describe('WebhookDeliveryService', () => {
  let service: WebhookDeliveryService;
  let mockDb: {
    select: jest.Mock;
    update: jest.Mock;
    insert: jest.Mock;
    delete: jest.Mock;
  };

  beforeEach(() => {
    jest.useFakeTimers();

    mockDb = {
      select: jest.fn().mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([]),
        }),
      }),
      update: jest.fn().mockReturnValue({
        set: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue(undefined),
        }),
      }),
      insert: jest.fn().mockReturnValue({
        values: jest.fn().mockResolvedValue(undefined),
      }),
      delete: jest.fn().mockReturnValue({
        where: jest.fn().mockResolvedValue(undefined),
      }),
    };

    service = new WebhookDeliveryService(mockDb as never);
    mockFetch.mockReset();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should compute correct HMAC signature', () => {
    const body = JSON.stringify({ event: 'order.created', payload: {} });
    const secret = 'test-secret';

    const sig1 = service.computeHmac(body, secret);
    const sig2 = service.computeHmac(body, secret);

    expect(sig1).toBe(sig2);
    expect(sig1).toHaveLength(64); // SHA-256 hex digest
    expect(sig1).toMatch(/^[0-9a-f]+$/);
  });

  it('should produce different signatures for different secrets', () => {
    const body = JSON.stringify({ event: 'test' });
    const sig1 = service.computeHmac(body, 'secret-1');
    const sig2 = service.computeHmac(body, 'secret-2');

    expect(sig1).not.toBe(sig2);
  });

  it('should deliver events only to matching subscriptions', async () => {
    const sub1 = {
      id: 'sub-1',
      tenant_id: 'tenant-1',
      url: 'https://a.com/hook',
      events: ['order.created'],
      secret: 'secret-1',
      is_active: true,
      delivery_count: 0,
      success_count: 0,
      last_delivery_at: null,
    };
    const sub2 = {
      id: 'sub-2',
      tenant_id: 'tenant-1',
      url: 'https://b.com/hook',
      events: ['order.completed'],
      secret: 'secret-2',
      is_active: true,
      delivery_count: 0,
      success_count: 0,
      last_delivery_at: null,
    };

    mockDb.select.mockReturnValue({
      from: jest.fn().mockReturnValue({
        where: jest.fn().mockResolvedValue([sub1, sub2]),
      }),
    });

    mockFetch.mockResolvedValue({ ok: true, status: 200 });

    await service.deliverEvent('tenant-1', 'order.created', {
      orderId: '123',
    });

    // Allow microtasks to resolve
    await Promise.resolve();

    // Only sub1 matches order.created
    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(mockFetch).toHaveBeenCalledWith(
      'https://a.com/hook',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'X-FoodTech-Signature': expect.any(String),
        }),
      }),
    );
  });

  it('should deliver to wildcard subscriptions', async () => {
    const wildcardSub = {
      id: 'sub-3',
      tenant_id: 'tenant-1',
      url: 'https://c.com/hook',
      events: ['*'],
      secret: 'secret-3',
      is_active: true,
      delivery_count: 0,
      success_count: 0,
      last_delivery_at: null,
    };

    mockDb.select.mockReturnValue({
      from: jest.fn().mockReturnValue({
        where: jest.fn().mockResolvedValue([wildcardSub]),
      }),
    });

    mockFetch.mockResolvedValue({ ok: true, status: 200 });

    await service.deliverEvent('tenant-1', 'any.event', {});
    await Promise.resolve();

    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it('should schedule retry on failure with backoff', async () => {
    const sub = {
      id: 'sub-1',
      tenant_id: 'tenant-1',
      url: 'https://a.com/hook',
      events: ['order.created'],
      secret: 'secret-1',
      is_active: true,
      delivery_count: 0,
      success_count: 0,
      last_delivery_at: null,
    };

    mockDb.select.mockReturnValue({
      from: jest.fn().mockReturnValue({
        where: jest.fn().mockResolvedValue([sub]),
      }),
    });

    mockFetch.mockRejectedValue(new Error('Connection refused'));

    await service.deliverEvent('tenant-1', 'order.created', {});
    await Promise.resolve();

    // First attempt should have been called
    expect(mockFetch).toHaveBeenCalledTimes(1);

    // A retry should be scheduled via setTimeout
    expect(jest.getTimerCount()).toBeGreaterThan(0);
  });

  it('should insert dead letter after max retries', async () => {
    jest.useRealTimers();

    const sub = {
      id: 'sub-1',
      tenant_id: 'tenant-1',
      url: 'https://a.com/hook',
      events: ['order.created'],
      secret: 'secret-1',
      is_active: true,
      delivery_count: 0,
      success_count: 0,
      last_delivery_at: null,
    };

    // Test the private method directly to avoid timer complexity
    // We verify the computeHmac + dead letter insertion path
    mockFetch.mockRejectedValue(new Error('Connection refused'));

    // Call the private deliverToSubscription with attempt = 2 (last attempt)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const svc = service as any;
    await svc.deliverToSubscription(
      sub,
      'order.created',
      { orderId: '123' },
      2,
    );

    // After final attempt fails, dead letter should be inserted
    expect(mockDb.insert).toHaveBeenCalled();
  });
});
