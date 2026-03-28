import { StationsRepository } from './stations.repository';

describe('StationsRepository', () => {
  let repository: StationsRepository;
  let mockDb: {
    insert: jest.Mock;
    select: jest.Mock;
    delete: jest.Mock;
    update: jest.Mock;
  };

  // Helper to build chainable mock query builders
  function chainable(overrides: Record<string, unknown> = {}) {
    const chain: Record<string, jest.Mock> = {};
    const methods = [
      'values',
      'returning',
      'from',
      'where',
      'orderBy',
      'limit',
      'set',
    ];
    for (const m of methods) {
      chain[m] = jest.fn().mockReturnValue(chain);
    }
    Object.assign(chain, overrides);
    return chain;
  }

  beforeEach(() => {
    mockDb = {
      insert: jest.fn(),
      select: jest.fn(),
      delete: jest.fn(),
      update: jest.fn(),
    };
    repository = new StationsRepository(mockDb as any);
  });

  describe('createStation', () => {
    it('should insert and return the created station', async () => {
      const data = {
        name: 'Grill',
        emoji: '🔥',
        display_order: 1,
        tenant_id: 'tenant-1',
      };
      const expected = { id: 'station-1', ...data };
      const chain = chainable({
        returning: jest.fn().mockResolvedValue([expected]),
      });
      mockDb.insert.mockReturnValue(chain);

      const result = await repository.createStation(data);

      expect(result).toEqual(expected);
      expect(mockDb.insert).toHaveBeenCalled();
      expect(chain.values).toHaveBeenCalledWith(data);
    });

    it('should handle station without emoji', async () => {
      const data = {
        name: 'Prep',
        display_order: 0,
        tenant_id: 'tenant-1',
      };
      const expected = { id: 'station-2', ...data };
      const chain = chainable({
        returning: jest.fn().mockResolvedValue([expected]),
      });
      mockDb.insert.mockReturnValue(chain);

      const result = await repository.createStation(data);

      expect(result).toEqual(expected);
    });
  });

  describe('findStationsByTenant', () => {
    it('should query stations filtered by tenant and active status', async () => {
      const stations = [
        { id: '1', name: 'Grill', tenant_id: 'tenant-1', is_active: true },
      ];
      const chain = chainable({
        orderBy: jest.fn().mockResolvedValue(stations),
      });
      mockDb.select.mockReturnValue(chain);

      const result = await repository.findStationsByTenant('tenant-1');

      expect(result).toEqual(stations);
      expect(mockDb.select).toHaveBeenCalled();
      expect(chain.from).toHaveBeenCalled();
      expect(chain.where).toHaveBeenCalled();
      expect(chain.orderBy).toHaveBeenCalled();
    });

    it('should return empty array when no stations found', async () => {
      const chain = chainable({
        orderBy: jest.fn().mockResolvedValue([]),
      });
      mockDb.select.mockReturnValue(chain);

      const result = await repository.findStationsByTenant('tenant-empty');

      expect(result).toEqual([]);
    });
  });

  describe('createOrderStages', () => {
    it('should insert multiple stages and return them', async () => {
      const stagesData = [
        { name: 'received', sequence: 0, tenant_id: 'tenant-1' },
        { name: 'preparing', sequence: 1, tenant_id: 'tenant-1' },
      ];
      const expected = stagesData.map((s, i) => ({ id: `stage-${i}`, ...s }));
      const chain = chainable({
        returning: jest.fn().mockResolvedValue(expected),
      });
      mockDb.insert.mockReturnValue(chain);

      const result = await repository.createOrderStages(stagesData);

      expect(result).toEqual(expected);
      expect(chain.values).toHaveBeenCalledWith(stagesData);
    });

    it('should return empty array for empty input', async () => {
      const result = await repository.createOrderStages([]);

      expect(result).toEqual([]);
      expect(mockDb.insert).not.toHaveBeenCalled();
    });
  });

  describe('deleteOrderStagesByTenant', () => {
    it('should delete stages for the given tenant', async () => {
      const chain = chainable({
        where: jest.fn().mockResolvedValue(undefined),
      });
      mockDb.delete.mockReturnValue(chain);

      await repository.deleteOrderStagesByTenant('tenant-1');

      expect(mockDb.delete).toHaveBeenCalled();
      expect(chain.where).toHaveBeenCalled();
    });
  });

  describe('findOrderStagesByTenant', () => {
    it('should query stages filtered by tenant ordered by sequence', async () => {
      const stages = [
        { id: '1', name: 'received', sequence: 0, tenant_id: 'tenant-1' },
        { id: '2', name: 'preparing', sequence: 1, tenant_id: 'tenant-1' },
      ];
      const chain = chainable({
        orderBy: jest.fn().mockResolvedValue(stages),
      });
      mockDb.select.mockReturnValue(chain);

      const result = await repository.findOrderStagesByTenant('tenant-1');

      expect(result).toEqual(stages);
      expect(chain.orderBy).toHaveBeenCalled();
    });

    it('should return empty array when no stages exist', async () => {
      const chain = chainable({
        orderBy: jest.fn().mockResolvedValue([]),
      });
      mockDb.select.mockReturnValue(chain);

      const result = await repository.findOrderStagesByTenant('tenant-empty');

      expect(result).toEqual([]);
    });
  });

  describe('findOrderStageById', () => {
    it('should return the stage when found', async () => {
      const stage = {
        id: 'stage-1',
        name: 'received',
        tenant_id: 'tenant-1',
      };
      const chain = chainable({
        limit: jest.fn().mockResolvedValue([stage]),
      });
      mockDb.select.mockReturnValue(chain);

      const result = await repository.findOrderStageById('stage-1', 'tenant-1');

      expect(result).toEqual(stage);
    });

    it('should return null when stage not found', async () => {
      const chain = chainable({
        limit: jest.fn().mockResolvedValue([]),
      });
      mockDb.select.mockReturnValue(chain);

      const result = await repository.findOrderStageById(
        'nonexistent',
        'tenant-1',
      );

      expect(result).toBeNull();
    });
  });

  describe('updateOrderStageThresholds', () => {
    it('should update and return the stage with new thresholds', async () => {
      const updated = {
        id: 'stage-1',
        warning_threshold_minutes: 7,
        critical_threshold_minutes: 12,
      };
      const chain = chainable({
        returning: jest.fn().mockResolvedValue([updated]),
      });
      mockDb.update.mockReturnValue(chain);

      const result = await repository.updateOrderStageThresholds('stage-1', {
        warning_threshold_minutes: 7,
        critical_threshold_minutes: 12,
      });

      expect(result).toEqual(updated);
      expect(mockDb.update).toHaveBeenCalled();
      expect(chain.set).toHaveBeenCalledWith({
        warning_threshold_minutes: 7,
        critical_threshold_minutes: 12,
      });
    });

    it('should handle partial update with only warning', async () => {
      const updated = {
        id: 'stage-1',
        warning_threshold_minutes: 10,
      };
      const chain = chainable({
        returning: jest.fn().mockResolvedValue([updated]),
      });
      mockDb.update.mockReturnValue(chain);

      const result = await repository.updateOrderStageThresholds('stage-1', {
        warning_threshold_minutes: 10,
      });

      expect(result).toEqual(updated);
      expect(chain.set).toHaveBeenCalledWith({
        warning_threshold_minutes: 10,
      });
    });

    it('should handle partial update with only critical', async () => {
      const updated = {
        id: 'stage-1',
        critical_threshold_minutes: 20,
      };
      const chain = chainable({
        returning: jest.fn().mockResolvedValue([updated]),
      });
      mockDb.update.mockReturnValue(chain);

      const result = await repository.updateOrderStageThresholds('stage-1', {
        critical_threshold_minutes: 20,
      });

      expect(result).toEqual(updated);
      expect(chain.set).toHaveBeenCalledWith({
        critical_threshold_minutes: 20,
      });
    });
  });
});
