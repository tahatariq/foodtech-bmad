import {
  StationsController,
  OrderStagesController,
} from './stations.controller';
import { StationsService } from './stations.service';

describe('StationsController', () => {
  let controller: StationsController;
  let mockService: {
    createStation: jest.Mock;
    findAllStations: jest.Mock;
    createOrderStages: jest.Mock;
    findOrderStages: jest.Mock;
    updateStageThresholds: jest.Mock;
  };

  beforeEach(() => {
    mockService = {
      createStation: jest.fn(),
      findAllStations: jest.fn(),
      createOrderStages: jest.fn(),
      findOrderStages: jest.fn(),
      updateStageThresholds: jest.fn(),
    };
    controller = new StationsController(
      mockService as unknown as StationsService,
    );
  });

  describe('createStation', () => {
    it('should call service.createStation with tenantId and dto', async () => {
      const dto = { name: 'Grill', emoji: '🔥', displayOrder: 1 };
      const expected = {
        id: 'station-1',
        name: 'Grill',
        emoji: '🔥',
        display_order: 1,
        tenant_id: 'tenant-1',
      };
      mockService.createStation.mockResolvedValue(expected);

      const result = await controller.createStation('tenant-1', dto);

      expect(result).toEqual(expected);
      expect(mockService.createStation).toHaveBeenCalledWith('tenant-1', dto);
    });

    it('should pass through the dto without modification', async () => {
      const dto = { name: 'Prep', displayOrder: 0 };
      mockService.createStation.mockResolvedValue({ id: 'station-2' });

      await controller.createStation('tenant-1', dto);

      expect(mockService.createStation).toHaveBeenCalledWith('tenant-1', dto);
    });

    it('should return the service result directly', async () => {
      const expected = {
        id: 'station-3',
        name: 'Fryer',
        display_order: 2,
        tenant_id: 'tenant-1',
      };
      mockService.createStation.mockResolvedValue(expected);

      const result = await controller.createStation('tenant-1', {
        name: 'Fryer',
        displayOrder: 2,
      });

      expect(result).toBe(expected);
    });

    it('should propagate service errors', async () => {
      mockService.createStation.mockRejectedValue(new Error('DB error'));

      await expect(
        controller.createStation('tenant-1', {
          name: 'Bad',
          displayOrder: 0,
        }),
      ).rejects.toThrow('DB error');
    });
  });

  describe('findAll', () => {
    it('should call service.findAllStations with tenantId', async () => {
      const stations = [
        { id: '1', name: 'Grill' },
        { id: '2', name: 'Fryer' },
      ];
      mockService.findAllStations.mockResolvedValue(stations);

      const result = await controller.findAll('tenant-1');

      expect(result).toEqual(stations);
      expect(mockService.findAllStations).toHaveBeenCalledWith('tenant-1');
    });

    it('should return empty array when no stations exist', async () => {
      mockService.findAllStations.mockResolvedValue([]);

      const result = await controller.findAll('tenant-1');

      expect(result).toEqual([]);
    });

    it('should use the correct tenantId', async () => {
      mockService.findAllStations.mockResolvedValue([]);

      await controller.findAll('tenant-xyz');

      expect(mockService.findAllStations).toHaveBeenCalledWith('tenant-xyz');
    });
  });
});

describe('OrderStagesController', () => {
  let controller: OrderStagesController;
  let mockService: {
    createStation: jest.Mock;
    findAllStations: jest.Mock;
    createOrderStages: jest.Mock;
    findOrderStages: jest.Mock;
    updateStageThresholds: jest.Mock;
  };

  beforeEach(() => {
    mockService = {
      createStation: jest.fn(),
      findAllStations: jest.fn(),
      createOrderStages: jest.fn(),
      findOrderStages: jest.fn(),
      updateStageThresholds: jest.fn(),
    };
    controller = new OrderStagesController(
      mockService as unknown as StationsService,
    );
  });

  describe('createOrderStages', () => {
    it('should call service.createOrderStages with tenantId and dto', async () => {
      const dto = {
        stages: [
          { name: 'received', sequence: 0 },
          { name: 'preparing', sequence: 1 },
        ],
      };
      const expected = [
        { id: '1', name: 'received', sequence: 0, tenant_id: 'tenant-1' },
        { id: '2', name: 'preparing', sequence: 1, tenant_id: 'tenant-1' },
      ];
      mockService.createOrderStages.mockResolvedValue(expected);

      const result = await controller.createOrderStages('tenant-1', dto);

      expect(result).toEqual(expected);
      expect(mockService.createOrderStages).toHaveBeenCalledWith(
        'tenant-1',
        dto,
      );
    });

    it('should handle single stage', async () => {
      const dto = { stages: [{ name: 'received', sequence: 0 }] };
      mockService.createOrderStages.mockResolvedValue([
        { id: '1', name: 'received', sequence: 0 },
      ]);

      const result = await controller.createOrderStages('tenant-1', dto);

      expect(result).toHaveLength(1);
    });

    it('should propagate service errors', async () => {
      mockService.createOrderStages.mockRejectedValue(
        new Error('Delete failed'),
      );

      await expect(
        controller.createOrderStages('tenant-1', {
          stages: [{ name: 'received', sequence: 0 }],
        }),
      ).rejects.toThrow('Delete failed');
    });
  });

  describe('findAll', () => {
    it('should call service.findOrderStages with tenantId', async () => {
      const stages = [
        { id: '1', name: 'received', sequence: 0 },
        { id: '2', name: 'preparing', sequence: 1 },
      ];
      mockService.findOrderStages.mockResolvedValue(stages);

      const result = await controller.findAll('tenant-1');

      expect(result).toEqual(stages);
      expect(mockService.findOrderStages).toHaveBeenCalledWith('tenant-1');
    });

    it('should return empty array when no stages exist', async () => {
      mockService.findOrderStages.mockResolvedValue([]);

      const result = await controller.findAll('tenant-1');

      expect(result).toEqual([]);
    });
  });

  describe('updateThresholds', () => {
    it('should call service.updateStageThresholds with all params', async () => {
      const dto = {
        warningThresholdMinutes: 7,
        criticalThresholdMinutes: 12,
      };
      const expected = {
        id: 'stage-1',
        warning_threshold_minutes: 7,
        critical_threshold_minutes: 12,
      };
      mockService.updateStageThresholds.mockResolvedValue(expected);

      const result = await controller.updateThresholds(
        'tenant-1',
        'stage-1',
        dto,
      );

      expect(result).toEqual(expected);
      expect(mockService.updateStageThresholds).toHaveBeenCalledWith(
        'tenant-1',
        'stage-1',
        dto,
      );
    });

    it('should pass partial dto (warning only)', async () => {
      const dto = { warningThresholdMinutes: 5 };
      mockService.updateStageThresholds.mockResolvedValue({
        id: 'stage-1',
        warning_threshold_minutes: 5,
      });

      await controller.updateThresholds('tenant-1', 'stage-1', dto);

      expect(mockService.updateStageThresholds).toHaveBeenCalledWith(
        'tenant-1',
        'stage-1',
        dto,
      );
    });

    it('should pass partial dto (critical only)', async () => {
      const dto = { criticalThresholdMinutes: 20 };
      mockService.updateStageThresholds.mockResolvedValue({
        id: 'stage-1',
        critical_threshold_minutes: 20,
      });

      await controller.updateThresholds('tenant-1', 'stage-1', dto);

      expect(mockService.updateStageThresholds).toHaveBeenCalledWith(
        'tenant-1',
        'stage-1',
        dto,
      );
    });

    it('should propagate NotFoundException from service', async () => {
      const { NotFoundException: NestNotFoundException } =
        await import('@nestjs/common');
      mockService.updateStageThresholds.mockRejectedValue(
        new NestNotFoundException('Stage not found'),
      );

      await expect(
        controller.updateThresholds('tenant-1', 'bad-id', {
          warningThresholdMinutes: 5,
        }),
      ).rejects.toThrow(NestNotFoundException);
    });

    it('should pass empty dto', async () => {
      mockService.updateStageThresholds.mockResolvedValue({ id: 'stage-1' });

      await controller.updateThresholds('tenant-1', 'stage-1', {});

      expect(mockService.updateStageThresholds).toHaveBeenCalledWith(
        'tenant-1',
        'stage-1',
        {},
      );
    });
  });
});
