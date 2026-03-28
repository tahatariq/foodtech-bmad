import { NotFoundException } from '@nestjs/common';
import { WebhookService } from './webhook.service';

describe('WebhookService', () => {
  let service: WebhookService;
  let mockDb: {
    insert: jest.Mock;
    select: jest.Mock;
    update: jest.Mock;
    delete: jest.Mock;
  };

  beforeEach(() => {
    mockDb = {
      insert: jest.fn().mockReturnValue({
        values: jest.fn().mockReturnValue({
          returning: jest.fn().mockResolvedValue([
            {
              id: 'wh-1',
              tenant_id: 'tenant-1',
              url: 'https://example.com/hook',
              events: ['order.created'],
              secret: 'raw-secret',
              is_active: true,
              delivery_count: 0,
              success_count: 0,
              last_delivery_at: null,
              created_at: new Date(),
            },
          ]),
        }),
      }),
      select: jest.fn().mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([
            {
              id: 'wh-1',
              url: 'https://example.com/hook',
              events: ['order.created'],
              is_active: true,
              delivery_count: 10,
              success_count: 8,
              last_delivery_at: new Date(),
              created_at: new Date(),
            },
          ]),
          innerJoin: jest.fn().mockReturnValue({
            where: jest.fn().mockResolvedValue([]),
          }),
        }),
      }),
      update: jest.fn().mockReturnValue({
        set: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            returning: jest.fn().mockResolvedValue([
              {
                id: 'wh-1',
                url: 'https://example.com/hook',
                events: ['order.created'],
                is_active: false,
              },
            ]),
          }),
        }),
      }),
      delete: jest.fn().mockReturnValue({
        where: jest.fn().mockResolvedValue(undefined),
      }),
    };

    service = new WebhookService(mockDb as never);
  });

  it('should create subscription and return secret', async () => {
    const result = await service.createSubscription(
      'tenant-1',
      'https://example.com/hook',
      ['order.created'],
    );

    expect(result.id).toBe('wh-1');
    expect(result.url).toBe('https://example.com/hook');
    expect(result.secret).toBeDefined();
    expect(result.is_active).toBe(true);
    expect(mockDb.insert).toHaveBeenCalled();
  });

  it('should list subscriptions with success_rate', async () => {
    const result = await service.listSubscriptions('tenant-1');

    expect(result).toHaveLength(1);
    expect(result[0].success_rate).toBe(80);
    expect(result[0].delivery_count).toBe(10);
    expect(result[0].success_count).toBe(8);
  });

  it('should compute 0 success_rate when no deliveries', async () => {
    mockDb.select.mockReturnValue({
      from: jest.fn().mockReturnValue({
        where: jest.fn().mockResolvedValue([
          {
            id: 'wh-2',
            url: 'https://example.com/hook2',
            events: ['order.created'],
            is_active: true,
            delivery_count: 0,
            success_count: 0,
            last_delivery_at: null,
            created_at: new Date(),
          },
        ]),
      }),
    });

    const result = await service.listSubscriptions('tenant-1');
    expect(result[0].success_rate).toBe(0);
  });

  it('should deactivate subscription by setting is_active false', async () => {
    const result = await service.deactivateSubscription('wh-1');

    expect(result.id).toBe('wh-1');
    expect(result.deactivated).toBe(true);
  });

  it('should throw NotFoundException when deactivating non-existent subscription', async () => {
    mockDb.update.mockReturnValue({
      set: jest.fn().mockReturnValue({
        where: jest.fn().mockReturnValue({
          returning: jest.fn().mockResolvedValue([]),
        }),
      }),
    });

    await expect(service.deactivateSubscription('nonexistent')).rejects.toThrow(
      NotFoundException,
    );
  });

  it('should update subscription url and events', async () => {
    mockDb.update.mockReturnValue({
      set: jest.fn().mockReturnValue({
        where: jest.fn().mockReturnValue({
          returning: jest.fn().mockResolvedValue([
            {
              id: 'wh-1',
              url: 'https://new.example.com/hook',
              events: ['order.created', 'order.completed'],
              is_active: true,
            },
          ]),
        }),
      }),
    });

    const result = await service.updateSubscription('wh-1', {
      url: 'https://new.example.com/hook',
      events: ['order.created', 'order.completed'],
    });

    expect(result.url).toBe('https://new.example.com/hook');
    expect(result.events).toEqual(['order.created', 'order.completed']);
  });

  it('should throw NotFoundException when updating non-existent subscription', async () => {
    mockDb.update.mockReturnValue({
      set: jest.fn().mockReturnValue({
        where: jest.fn().mockReturnValue({
          returning: jest.fn().mockResolvedValue([]),
        }),
      }),
    });

    await expect(
      service.updateSubscription('nonexistent', { url: 'https://x.com' }),
    ).rejects.toThrow(NotFoundException);
  });

  it('should update subscription with only url', async () => {
    mockDb.update.mockReturnValue({
      set: jest.fn().mockReturnValue({
        where: jest.fn().mockReturnValue({
          returning: jest.fn().mockResolvedValue([
            {
              id: 'wh-1',
              url: 'https://updated.com/hook',
              events: ['order.created'],
              is_active: true,
            },
          ]),
        }),
      }),
    });

    const result = await service.updateSubscription('wh-1', {
      url: 'https://updated.com/hook',
    });

    expect(result.url).toBe('https://updated.com/hook');
    expect(result.is_active).toBe(true);
  });

  it('should update subscription with only events', async () => {
    mockDb.update.mockReturnValue({
      set: jest.fn().mockReturnValue({
        where: jest.fn().mockReturnValue({
          returning: jest.fn().mockResolvedValue([
            {
              id: 'wh-1',
              url: 'https://example.com/hook',
              events: ['order.completed'],
              is_active: true,
            },
          ]),
        }),
      }),
    });

    const result = await service.updateSubscription('wh-1', {
      events: ['order.completed'],
    });

    expect(result.events).toEqual(['order.completed']);
  });

  it('should return dead letters for a tenant', async () => {
    const deadLetters = [
      {
        id: 'dl-1',
        subscription_id: 'wh-1',
        event_type: 'order.created',
        payload: { orderId: '123' },
        error: 'Connection refused',
        attempts: 3,
        created_at: new Date(),
      },
    ];

    mockDb.select.mockReturnValue({
      from: jest.fn().mockReturnValue({
        where: jest.fn().mockResolvedValue([]),
        innerJoin: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue(deadLetters),
        }),
      }),
    });

    const result = await service.getDeadLetters('tenant-1');
    expect(result).toEqual(deadLetters);
    expect(result).toHaveLength(1);
    expect(result[0].event_type).toBe('order.created');
  });

  it('should return empty array when no dead letters exist', async () => {
    // default mock already returns [] for innerJoin path
    const result = await service.getDeadLetters('tenant-1');
    expect(result).toEqual([]);
  });

  it('should get dead letter by id', async () => {
    const dl = {
      id: 'dl-1',
      subscription_id: 'wh-1',
      event_type: 'order.created',
      payload: { orderId: '123' },
      error: 'Timeout',
      attempts: 3,
      created_at: new Date(),
    };

    mockDb.select.mockReturnValue({
      from: jest.fn().mockReturnValue({
        where: jest.fn().mockResolvedValue([dl]),
      }),
    });

    const result = await service.getDeadLetterById('dl-1');
    expect(result).toEqual(dl);
    expect(result.id).toBe('dl-1');
  });

  it('should throw NotFoundException when dead letter not found', async () => {
    mockDb.select.mockReturnValue({
      from: jest.fn().mockReturnValue({
        where: jest.fn().mockResolvedValue([]),
      }),
    });

    await expect(service.getDeadLetterById('nonexistent')).rejects.toThrow(
      NotFoundException,
    );
  });

  it('should delete dead letter by id', async () => {
    await service.deleteDeadLetter('dl-1');
    expect(mockDb.delete).toHaveBeenCalled();
  });

  it('should list multiple subscriptions with correct success rates', async () => {
    mockDb.select.mockReturnValue({
      from: jest.fn().mockReturnValue({
        where: jest.fn().mockResolvedValue([
          {
            id: 'wh-1',
            url: 'https://a.com/hook',
            events: ['order.created'],
            is_active: true,
            delivery_count: 100,
            success_count: 99,
            last_delivery_at: new Date(),
            created_at: new Date(),
          },
          {
            id: 'wh-2',
            url: 'https://b.com/hook',
            events: ['*'],
            is_active: true,
            delivery_count: 3,
            success_count: 1,
            last_delivery_at: new Date(),
            created_at: new Date(),
          },
        ]),
      }),
    });

    const result = await service.listSubscriptions('tenant-1');
    expect(result).toHaveLength(2);
    expect(result[0].success_rate).toBe(99);
    expect(result[1].success_rate).toBe(33.33);
  });
});
