import { CustomerTrackerGateway } from './customer-tracker.gateway';
import { CustomerTrackerService } from './customer-tracker.service';

describe('CustomerTrackerGateway', () => {
  let gateway: CustomerTrackerGateway;
  let mockService: jest.Mocked<
    Pick<CustomerTrackerService, 'findOrderByToken'>
  >;

  beforeEach(() => {
    mockService = {
      findOrderByToken: jest.fn(),
    };
    gateway = new CustomerTrackerGateway(
      mockService as unknown as CustomerTrackerService,
    );
  });

  describe('handleConnection', () => {
    it('should disconnect client with no token', async () => {
      const client = {
        handshake: { query: {} },
        disconnect: jest.fn(),
        data: {},
        join: jest.fn(),
      } as any;

      await gateway.handleConnection(client);
      expect(client.disconnect).toHaveBeenCalled();
    });

    it('should disconnect client with expired token', async () => {
      mockService.findOrderByToken.mockResolvedValue({ expired: true });

      const client = {
        handshake: { query: { token: 'expired-token' } },
        disconnect: jest.fn(),
        data: {},
        join: jest.fn(),
      } as any;

      await gateway.handleConnection(client);
      expect(client.disconnect).toHaveBeenCalled();
    });

    it('should disconnect client with unknown token', async () => {
      mockService.findOrderByToken.mockResolvedValue(null);

      const client = {
        handshake: { query: { token: 'unknown-token' } },
        disconnect: jest.fn(),
        data: {},
        join: jest.fn(),
      } as any;

      await gateway.handleConnection(client);
      expect(client.disconnect).toHaveBeenCalled();
    });

    it('should join room for valid token', async () => {
      mockService.findOrderByToken.mockResolvedValue({
        expired: false,
        orderId: 'order-123',
        orderNumber: 'ORD-001',
        status: 'received' as const,
        items: [],
        createdAt: new Date(),
      });

      const client = {
        handshake: { query: { token: 'valid-token' } },
        disconnect: jest.fn(),
        data: {},
        join: jest.fn(),
      } as any;

      await gateway.handleConnection(client);
      expect(client.disconnect).not.toHaveBeenCalled();
      expect(client.join).toHaveBeenCalledWith('customer:order-123');
      expect(client.data).toEqual({
        orderId: 'order-123',
        token: 'valid-token',
      });
    });
  });

  describe('handleSync', () => {
    it('should emit current order state', async () => {
      const orderData = {
        expired: false,
        orderId: 'order-123',
        orderNumber: 'ORD-001',
        status: 'preparing' as const,
        items: [],
        createdAt: new Date(),
      };
      mockService.findOrderByToken.mockResolvedValue(orderData);

      const client = {
        data: { token: 'valid-token' },
        emit: jest.fn(),
      } as any;

      await gateway.handleSync(client);
      expect(client.emit).toHaveBeenCalledWith('order.state', orderData);
    });

    it('should not emit if no token in client data', async () => {
      const client = {
        data: {},
        emit: jest.fn(),
      } as any;

      await gateway.handleSync(client);
      expect(client.emit).not.toHaveBeenCalled();
    });
  });
});
