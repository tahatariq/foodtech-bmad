import { NotFoundException } from '@nestjs/common';
import { StationsService } from './stations.service';

describe('StationsService', () => {
  let service: StationsService;
  let mockRepository: {
    createStation: jest.Mock;
    findStationsByTenant: jest.Mock;
    createOrderStages: jest.Mock;
    deleteOrderStagesByTenant: jest.Mock;
    findOrderStagesByTenant: jest.Mock;
    findOrderStageById: jest.Mock;
    updateOrderStageThresholds: jest.Mock;
  };

  beforeEach(() => {
    mockRepository = {
      createStation: jest.fn(),
      findStationsByTenant: jest.fn(),
      createOrderStages: jest.fn(),
      deleteOrderStagesByTenant: jest.fn(),
      findOrderStagesByTenant: jest.fn(),
      findOrderStageById: jest.fn(),
      updateOrderStageThresholds: jest.fn(),
    };
    service = new StationsService(
      mockRepository as unknown as import('./stations.repository').StationsRepository,
    );
  });

  it('should create a station with correct shape', async () => {
    const expected = {
      id: 'station-1',
      name: 'Grill',
      emoji: '🔥',
      display_order: 1,
      tenant_id: 'tenant-1',
    };
    mockRepository.createStation.mockResolvedValue(expected);

    const result = await service.createStation('tenant-1', {
      name: 'Grill',
      emoji: '🔥',
      displayOrder: 1,
    });

    expect(result).toEqual(expected);
    expect(mockRepository.createStation).toHaveBeenCalledWith({
      name: 'Grill',
      emoji: '🔥',
      display_order: 1,
      tenant_id: 'tenant-1',
    });
  });

  it('should find stations by tenant', async () => {
    const stations = [
      { id: '1', name: 'Grill', tenant_id: 'tenant-1' },
      { id: '2', name: 'Fryer', tenant_id: 'tenant-1' },
    ];
    mockRepository.findStationsByTenant.mockResolvedValue(stations);

    const result = await service.findAllStations('tenant-1');
    expect(result).toHaveLength(2);
    expect(mockRepository.findStationsByTenant).toHaveBeenCalledWith(
      'tenant-1',
    );
  });

  it('should create order stages replacing existing ones', async () => {
    const stages = [
      { name: 'received', sequence: 0, tenant_id: 'tenant-1' },
      { name: 'preparing', sequence: 1, tenant_id: 'tenant-1' },
    ];
    mockRepository.deleteOrderStagesByTenant.mockResolvedValue(undefined);
    mockRepository.createOrderStages.mockResolvedValue(stages);

    const result = await service.createOrderStages('tenant-1', {
      stages: [
        { name: 'received', sequence: 0 },
        { name: 'preparing', sequence: 1 },
      ],
    });

    expect(mockRepository.deleteOrderStagesByTenant).toHaveBeenCalledWith(
      'tenant-1',
    );
    expect(result).toHaveLength(2);
  });

  it('should find order stages by tenant', async () => {
    const stages = [
      { id: '1', name: 'received', sequence: 0, tenant_id: 'tenant-1' },
    ];
    mockRepository.findOrderStagesByTenant.mockResolvedValue(stages);

    const result = await service.findOrderStages('tenant-1');
    expect(result).toEqual(stages);
  });

  describe('updateStageThresholds', () => {
    it('should update warning and critical thresholds', async () => {
      mockRepository.findOrderStageById.mockResolvedValue({
        id: 'stage-1',
        name: 'received',
        sequence: 0,
        warning_threshold_minutes: 5,
        critical_threshold_minutes: 8,
        tenant_id: 'tenant-1',
      });
      mockRepository.updateOrderStageThresholds.mockResolvedValue({
        id: 'stage-1',
        name: 'received',
        sequence: 0,
        warning_threshold_minutes: 7,
        critical_threshold_minutes: 12,
        tenant_id: 'tenant-1',
      });

      const result = await service.updateStageThresholds(
        'tenant-1',
        'stage-1',
        { warningThresholdMinutes: 7, criticalThresholdMinutes: 12 },
      );

      expect(result.warning_threshold_minutes).toBe(7);
      expect(result.critical_threshold_minutes).toBe(12);
      expect(mockRepository.updateOrderStageThresholds).toHaveBeenCalledWith(
        'stage-1',
        {
          warning_threshold_minutes: 7,
          critical_threshold_minutes: 12,
        },
      );
    });

    it('should throw NotFoundException for nonexistent stage', async () => {
      mockRepository.findOrderStageById.mockResolvedValue(null);

      await expect(
        service.updateStageThresholds('tenant-1', 'nonexistent', {
          warningThresholdMinutes: 7,
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should update only warning threshold when critical not provided', async () => {
      mockRepository.findOrderStageById.mockResolvedValue({
        id: 'stage-1',
        name: 'received',
        tenant_id: 'tenant-1',
      });
      mockRepository.updateOrderStageThresholds.mockResolvedValue({
        id: 'stage-1',
        warning_threshold_minutes: 10,
        critical_threshold_minutes: 8,
      });

      await service.updateStageThresholds('tenant-1', 'stage-1', {
        warningThresholdMinutes: 10,
      });

      expect(mockRepository.updateOrderStageThresholds).toHaveBeenCalledWith(
        'stage-1',
        { warning_threshold_minutes: 10 },
      );
    });
  });
});
