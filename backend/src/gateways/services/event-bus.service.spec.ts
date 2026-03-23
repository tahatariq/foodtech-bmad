import { EventBusService } from './event-bus.service';

describe('EventBusService', () => {
  let service: EventBusService;
  let mockEmit: jest.Mock;
  let mockTo: jest.Mock;
  let mockServer: import('socket.io').Server;

  beforeEach(() => {
    service = new EventBusService();
    mockEmit = jest.fn();
    mockTo = jest.fn().mockReturnValue({ emit: mockEmit });
    mockServer = {
      of: jest.fn().mockReturnValue({
        emit: mockEmit,
        to: mockTo,
        sockets: new Map(),
      }),
    } as unknown as import('socket.io').Server;
    service.setServer(mockServer);
  });

  it('should emit event to correct tenant namespace', () => {
    service.emit({
      event: 'order.created',
      payload: { id: '1' },
      tenantId: 'tenant-abc',
      timestamp: '2026-01-01T00:00:00Z',
      eventId: 'evt-1',
    });

    expect(
      (mockServer as unknown as { of: jest.Mock }).of,
    ).toHaveBeenCalledWith('/tenant-tenant-abc');
    expect(mockEmit).toHaveBeenCalledWith(
      'order.created',
      expect.objectContaining({ tenantId: 'tenant-abc' }),
    );
  });

  it('should throw when tenantId is missing', () => {
    expect(() =>
      service.emit({
        event: 'test',
        payload: {},
        tenantId: '',
        timestamp: '',
        eventId: '',
      }),
    ).toThrow('tenantId is required');
  });

  it('should emit to specific room within tenant', () => {
    service.emitToRoom('tenant-abc', 'expeditor', {
      event: 'order.created',
      payload: { id: '1' },
      tenantId: 'tenant-abc',
      timestamp: '',
      eventId: '',
    });

    expect(
      (mockServer as unknown as { of: jest.Mock }).of,
    ).toHaveBeenCalledWith('/tenant-tenant-abc');
    expect(mockTo).toHaveBeenCalledWith('expeditor');
  });

  it('should not throw when server is not set', () => {
    const noServerService = new EventBusService();
    expect(() =>
      noServerService.emit({
        event: 'test',
        payload: {},
        tenantId: 'tenant-1',
        timestamp: '',
        eventId: '',
      }),
    ).not.toThrow();
  });
});
