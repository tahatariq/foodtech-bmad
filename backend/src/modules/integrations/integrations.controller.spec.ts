import { IntegrationsController } from './integrations.controller';
import { WebhookService } from './webhook.service';
import { WebhookDeliveryService } from './webhook-delivery.service';
import { IntegrationsApiKeysService } from './integrations-api-keys.service';

describe('IntegrationsController', () => {
  let controller: IntegrationsController;
  let webhookService: jest.Mocked<WebhookService>;
  let webhookDeliveryService: jest.Mocked<WebhookDeliveryService>;
  let apiKeysService: jest.Mocked<IntegrationsApiKeysService>;

  beforeEach(() => {
    webhookService = {
      createSubscription: jest.fn(),
      listSubscriptions: jest.fn(),
      deactivateSubscription: jest.fn(),
      updateSubscription: jest.fn(),
      getDeadLetters: jest.fn(),
      getDeadLetterById: jest.fn(),
      deleteDeadLetter: jest.fn(),
    } as unknown as jest.Mocked<WebhookService>;

    webhookDeliveryService = {
      retryDeadLetter: jest.fn(),
      deliverEvent: jest.fn(),
      computeHmac: jest.fn(),
    } as unknown as jest.Mocked<WebhookDeliveryService>;

    apiKeysService = {
      generateKeyPair: jest.fn(),
      listKeys: jest.fn(),
      revokeKey: jest.fn(),
      rotateKey: jest.fn(),
      validateApiKey: jest.fn(),
    } as unknown as jest.Mocked<IntegrationsApiKeysService>;

    controller = new IntegrationsController(
      webhookService,
      webhookDeliveryService,
      apiKeysService,
    );
  });

  // ── Webhook endpoints ─────────────────────────────────────────

  describe('createWebhook', () => {
    it('should create a webhook with default tenant', async () => {
      const dto = {
        url: 'https://example.com/hook',
        events: ['order.created'],
      };
      const expected = {
        id: 'wh-1',
        url: dto.url,
        events: dto.events,
        secret: 'abc',
        is_active: true,
        created_at: new Date(),
      };

      webhookService.createSubscription.mockResolvedValue(expected);

      const result = await controller.createWebhook(dto);

      expect(result).toEqual(expected);
      expect(webhookService.createSubscription).toHaveBeenCalledWith(
        'default-tenant',
        dto.url,
        dto.events,
      );
    });
  });

  describe('createWebhookForTenant', () => {
    it('should create a webhook for a specific tenant', async () => {
      const dto = {
        url: 'https://example.com/hook',
        events: ['order.created', 'order.completed'],
      };
      const expected = {
        id: 'wh-2',
        url: dto.url,
        events: dto.events,
        secret: 'xyz',
        is_active: true,
        created_at: new Date(),
      };

      webhookService.createSubscription.mockResolvedValue(expected);

      const result = await controller.createWebhookForTenant('tenant-42', dto);

      expect(result).toEqual(expected);
      expect(webhookService.createSubscription).toHaveBeenCalledWith(
        'tenant-42',
        dto.url,
        dto.events,
      );
    });
  });

  describe('listWebhooks', () => {
    it('should list webhooks for a tenant', async () => {
      const webhooks = [
        {
          id: 'wh-1',
          url: 'https://a.com',
          events: ['order.created'],
          is_active: true,
          delivery_count: 5,
          success_count: 4,
          last_delivery_at: new Date(),
          created_at: new Date(),
          success_rate: 80,
        },
      ];

      webhookService.listSubscriptions.mockResolvedValue(webhooks);

      const result = await controller.listWebhooks('tenant-1');

      expect(result).toEqual(webhooks);
      expect(webhookService.listSubscriptions).toHaveBeenCalledWith('tenant-1');
    });

    it('should return empty array when no webhooks exist', async () => {
      webhookService.listSubscriptions.mockResolvedValue([]);

      const result = await controller.listWebhooks('tenant-empty');
      expect(result).toEqual([]);
    });
  });

  describe('deactivateWebhook', () => {
    it('should deactivate a webhook', async () => {
      webhookService.deactivateSubscription.mockResolvedValue({
        id: 'wh-1',
        deactivated: true,
      });

      const result = await controller.deactivateWebhook('wh-1');

      expect(result).toEqual({ id: 'wh-1', deactivated: true });
      expect(webhookService.deactivateSubscription).toHaveBeenCalledWith(
        'wh-1',
      );
    });
  });

  describe('updateWebhook', () => {
    it('should update a webhook', async () => {
      const dto = { url: 'https://new.com/hook' };
      const expected = {
        id: 'wh-1',
        url: 'https://new.com/hook',
        events: ['order.created'],
        is_active: true,
      };

      webhookService.updateSubscription.mockResolvedValue(expected);

      const result = await controller.updateWebhook('wh-1', dto);

      expect(result).toEqual(expected);
      expect(webhookService.updateSubscription).toHaveBeenCalledWith(
        'wh-1',
        dto,
      );
    });
  });

  describe('getDeadLetters', () => {
    it('should return dead letters for a tenant', async () => {
      const deadLetters = [
        {
          id: 'dl-1',
          subscription_id: 'wh-1',
          event_type: 'order.created',
          payload: { orderId: '123' },
          error: 'Timeout',
          attempts: 3,
          created_at: new Date(),
        },
      ];

      webhookService.getDeadLetters.mockResolvedValue(deadLetters);

      const result = await controller.getDeadLetters('tenant-1');

      expect(result).toEqual(deadLetters);
      expect(webhookService.getDeadLetters).toHaveBeenCalledWith('tenant-1');
    });
  });

  describe('retryDeadLetter', () => {
    it('should retry a dead letter and return confirmation', async () => {
      webhookDeliveryService.retryDeadLetter.mockResolvedValue(undefined);

      const result = await controller.retryDeadLetter('dl-1');

      expect(result).toEqual({ id: 'dl-1', retried: true });
      expect(webhookDeliveryService.retryDeadLetter).toHaveBeenCalledWith(
        'dl-1',
      );
    });
  });

  // ── API Key endpoints ─────────────────────────────────────────

  describe('generateApiKey', () => {
    it('should generate an API key pair for a tenant', async () => {
      const expected = {
        id: 'key-1',
        key: 'ft_key_abc123',
        secret: 'secret-value',
        keyPrefix: 'ft_key_abc12',
        created_at: new Date(),
      };

      apiKeysService.generateKeyPair.mockResolvedValue(expected);

      const result = await controller.generateApiKey('tenant-1');

      expect(result).toEqual(expected);
      expect(apiKeysService.generateKeyPair).toHaveBeenCalledWith('tenant-1');
    });
  });

  describe('listApiKeys', () => {
    it('should list API keys for a tenant', async () => {
      const keys = [
        {
          id: 'key-1',
          key_prefix: 'ft_key_abc12',
          is_active: true,
          grace_period_until: null,
          created_at: new Date(),
          revoked_at: null,
        },
      ];

      apiKeysService.listKeys.mockResolvedValue(keys);

      const result = await controller.listApiKeys('tenant-1');

      expect(result).toEqual(keys);
      expect(apiKeysService.listKeys).toHaveBeenCalledWith('tenant-1');
    });

    it('should return empty array when no API keys exist', async () => {
      apiKeysService.listKeys.mockResolvedValue([]);

      const result = await controller.listApiKeys('tenant-empty');
      expect(result).toEqual([]);
    });
  });

  describe('revokeApiKey', () => {
    it('should revoke an API key', async () => {
      apiKeysService.revokeKey.mockResolvedValue({
        id: 'key-1',
        revoked: true,
      });

      const result = await controller.revokeApiKey('key-1');

      expect(result).toEqual({ id: 'key-1', revoked: true });
      expect(apiKeysService.revokeKey).toHaveBeenCalledWith('key-1');
    });
  });

  describe('rotateApiKey', () => {
    it('should rotate an API key', async () => {
      const newKey = {
        id: 'key-2',
        key: 'ft_key_new123',
        secret: 'new-secret',
        keyPrefix: 'ft_key_new12',
        created_at: new Date(),
      };

      apiKeysService.rotateKey.mockResolvedValue(newKey);

      const result = await controller.rotateApiKey('tenant-1', 'key-1');

      expect(result).toEqual(newKey);
      expect(apiKeysService.rotateKey).toHaveBeenCalledWith(
        'key-1',
        'tenant-1',
      );
    });
  });
});
