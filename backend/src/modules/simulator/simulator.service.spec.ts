import { BadRequestException } from '@nestjs/common';
import { SimulatorService } from './simulator.service';

describe('SimulatorService', () => {
  let service: SimulatorService;
  let mockDb: {
    select: jest.Mock;
    insert: jest.Mock;
    delete: jest.Mock;
  };

  beforeEach(() => {
    jest.useFakeTimers();

    const mockStations = [
      { id: 'station-1', name: 'Grill', tenant_id: 'tenant-1' },
    ];

    mockDb = {
      select: jest.fn().mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockImplementation(() => {
            return Promise.resolve(mockStations);
          }),
        }),
      }),
      insert: jest.fn().mockReturnValue({
        values: jest.fn().mockReturnValue({
          returning: jest.fn().mockResolvedValue([
            {
              id: 'order-1',
              order_number: 'SIM-TEST',
              status: 'received',
              is_simulated: true,
              tenant_id: 'tenant-1',
            },
          ]),
        }),
      }),
      delete: jest.fn().mockReturnValue({
        where: jest.fn().mockResolvedValue(undefined),
      }),
    };

    service = new SimulatorService(mockDb as never);
  });

  afterEach(() => {
    // Stop any running simulations
    service.stop('tenant-1');
    jest.useRealTimers();
  });

  it('should start generating orders', async () => {
    await service.start('tenant-1', 'rush');

    const status = service.getStatus('tenant-1');
    expect(status.running).toBe(true);
    expect(status.ordersGenerated).toBe(1); // First order generated immediately
    expect(status.pace).toBe('rush');
  });

  it('should throw when no stations configured', async () => {
    // Override stations query to return empty
    mockDb.select.mockReturnValue({
      from: jest.fn().mockReturnValue({
        where: jest.fn().mockResolvedValue([]),
      }),
    });

    await expect(service.start('tenant-1', 'rush')).rejects.toThrow(
      BadRequestException,
    );
  });

  it('should throw when already running', async () => {
    await service.start('tenant-1', 'rush');
    await expect(service.start('tenant-1', 'rush')).rejects.toThrow(
      BadRequestException,
    );
  });

  it('should stop and clear interval', async () => {
    await service.start('tenant-1', 'rush');
    const result = service.stop('tenant-1');

    expect(result.running).toBe(false);
    expect(result.ordersGenerated).toBe(1);

    const status = service.getStatus('tenant-1');
    expect(status.running).toBe(false);
  });

  it('should report not running when never started', () => {
    const status = service.getStatus('tenant-1');
    expect(status.running).toBe(false);
    expect(status.ordersGenerated).toBe(0);
    expect(status.pace).toBeNull();
  });

  it('should clear simulated data', async () => {
    // Mock finding simulated orders
    mockDb.select.mockReturnValue({
      from: jest.fn().mockReturnValue({
        where: jest
          .fn()
          .mockResolvedValue([{ id: 'order-1' }, { id: 'order-2' }]),
      }),
    });

    const result = await service.clearSimulatedData('tenant-1');
    expect(result.deleted).toBe(2);
  });

  it('should return zero deleted when no simulated orders', async () => {
    mockDb.select.mockReturnValue({
      from: jest.fn().mockReturnValue({
        where: jest.fn().mockResolvedValue([]),
      }),
    });

    const result = await service.clearSimulatedData('tenant-1');
    expect(result.deleted).toBe(0);
  });
});
