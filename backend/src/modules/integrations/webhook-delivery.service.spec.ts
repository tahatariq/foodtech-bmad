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

  it('should produce different signatures for different bodies', () => {
    const secret = 'same-secret';
    const sig1 = service.computeHmac('{"event":"a"}', secret);
    const sig2 = service.computeHmac('{"event":"b"}', secret);

    expect(sig1).not.toBe(sig2);
  });

  it('should record success on successful delivery', async () => {
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

    mockFetch.mockResolvedValue({ ok: true, status: 200 });

    const svc = service as any;
    await svc.deliverToSubscription(sub, 'order.created', { orderId: '1' }, 0);

    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(mockDb.update).toHaveBeenCalled();
  });

  it('should record delivery on failed attempt', async () => {
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

    mockFetch.mockRejectedValue(new Error('Network error'));

    const svc = service as any;
    await svc.deliverToSubscription(sub, 'order.created', {}, 0);

    // Should record delivery (failure)
    expect(mockDb.update).toHaveBeenCalled();
  });

  it('should throw on non-ok HTTP response and retry', async () => {
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

    mockFetch.mockResolvedValue({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
    });

    const svc = service as any;
    await svc.deliverToSubscription(sub, 'order.created', {}, 0);

    // Should have called fetch and recorded delivery
    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(mockDb.update).toHaveBeenCalled();
  });

  it('should move to dead letter on final non-ok HTTP response', async () => {
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

    mockFetch.mockResolvedValue({
      ok: false,
      status: 502,
      statusText: 'Bad Gateway',
    });

    const svc = service as any;
    await svc.deliverToSubscription(sub, 'order.created', {}, 2);

    expect(mockDb.insert).toHaveBeenCalled();
  });

  it('should not deliver when no subscriptions match', async () => {
    mockDb.select.mockReturnValue({
      from: jest.fn().mockReturnValue({
        where: jest.fn().mockResolvedValue([]),
      }),
    });

    await service.deliverEvent('tenant-1', 'order.created', {});
    await Promise.resolve();

    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('should retry dead letter - happy path', async () => {
    jest.useRealTimers();

    const dl = {
      id: 'dl-1',
      subscription_id: 'sub-1',
      event_type: 'order.created',
      payload: { orderId: '123' },
      error: 'Connection refused',
      attempts: 3,
      created_at: new Date(),
    };

    const sub = {
      id: 'sub-1',
      tenant_id: 'tenant-1',
      url: 'https://a.com/hook',
      events: ['order.created'],
      secret: 'secret-1',
      is_active: true,
      delivery_count: 5,
      success_count: 3,
      last_delivery_at: null,
    };

    // First select returns dead letter, second returns subscription
    mockDb.select
      .mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([dl]),
        }),
      })
      .mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([sub]),
        }),
      });

    mockFetch.mockResolvedValue({ ok: true, status: 200 });

    await service.retryDeadLetter('dl-1');

    // Dead letter should be deleted
    expect(mockDb.delete).toHaveBeenCalled();
  });

  it('should not retry dead letter when dead letter not found', async () => {
    mockDb.select.mockReturnValue({
      from: jest.fn().mockReturnValue({
        where: jest.fn().mockResolvedValue([]),
      }),
    });

    await service.retryDeadLetter('nonexistent');

    // Should not attempt delete or fetch
    expect(mockDb.delete).not.toHaveBeenCalled();
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('should not retry dead letter when subscription is inactive', async () => {
    jest.useRealTimers();

    const dl = {
      id: 'dl-1',
      subscription_id: 'sub-1',
      event_type: 'order.created',
      payload: { orderId: '123' },
      error: 'Timeout',
      attempts: 3,
      created_at: new Date(),
    };

    const inactiveSub = {
      id: 'sub-1',
      tenant_id: 'tenant-1',
      url: 'https://a.com/hook',
      events: ['order.created'],
      secret: 'secret-1',
      is_active: false,
      delivery_count: 5,
      success_count: 3,
      last_delivery_at: null,
    };

    mockDb.select
      .mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([dl]),
        }),
      })
      .mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([inactiveSub]),
        }),
      });

    await service.retryDeadLetter('dl-1');

    // Should not delete or fetch since sub is inactive
    expect(mockDb.delete).not.toHaveBeenCalled();
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('should not retry dead letter when subscription not found', async () => {
    jest.useRealTimers();

    const dl = {
      id: 'dl-1',
      subscription_id: 'sub-gone',
      event_type: 'order.created',
      payload: {},
      error: 'Timeout',
      attempts: 3,
      created_at: new Date(),
    };

    mockDb.select
      .mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([dl]),
        }),
      })
      .mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([]),
        }),
      });

    await service.retryDeadLetter('dl-1');

    expect(mockDb.delete).not.toHaveBeenCalled();
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('should include X-FoodTech-Signature header in delivery', async () => {
    jest.useRealTimers();

    const sub = {
      id: 'sub-1',
      tenant_id: 'tenant-1',
      url: 'https://a.com/hook',
      events: ['order.created'],
      secret: 'my-secret',
      is_active: true,
      delivery_count: 0,
      success_count: 0,
      last_delivery_at: null,
    };

    mockFetch.mockResolvedValue({ ok: true, status: 200 });

    const svc = service as any;
    await svc.deliverToSubscription(sub, 'order.created', { id: '1' }, 0);

    const fetchCall = mockFetch.mock.calls[0];
    expect(fetchCall[1].headers['X-FoodTech-Signature']).toBeDefined();
    expect(fetchCall[1].headers['Content-Type']).toBe('application/json');
    expect(fetchCall[1].method).toBe('POST');
  });
});
