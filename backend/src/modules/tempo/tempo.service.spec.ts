import { TempoService } from './tempo.service';

describe('TempoService', () => {
  let service: TempoService;
  let mockRepository: { getActiveOrderItems: jest.Mock };
  let mockEventBus: { emit: jest.Mock };

  beforeEach(() => {
    mockRepository = { getActiveOrderItems: jest.fn() };
    mockEventBus = { emit: jest.fn() };
    service = new TempoService(mockRepository as any, mockEventBus as any);
  });

  describe('getTempoStatus', () => {
    it('returns green below target', () => {
      expect(service.getTempoStatus(3, 5)).toBe('green');
      expect(service.getTempoStatus(0, 5)).toBe('green');
    });

    it('returns amber between target and 2x target', () => {
      expect(service.getTempoStatus(5, 5)).toBe('amber');
      expect(service.getTempoStatus(7, 5)).toBe('amber');
      expect(service.getTempoStatus(10, 5)).toBe('amber');
    });

    it('returns red above 2x target', () => {
      expect(service.getTempoStatus(11, 5)).toBe('red');
      expect(service.getTempoStatus(20, 5)).toBe('red');
    });
  });

  describe('calculateTempo', () => {
    it('returns 0 with green status when no active orders', async () => {
      mockRepository.getActiveOrderItems.mockResolvedValue([]);

      const result = await service.calculateTempo('tenant-1');

      expect(result.tempoValue).toBe(0);
      expect(result.status).toBe('green');
      expect(result.stationBreakdown).toHaveLength(0);
    });

    it('calculates correct average for known ticket times', async () => {
      const now = Date.now();
      mockRepository.getActiveOrderItems.mockResolvedValue([
        {
          id: 'i1',
          station_id: 'st1',
          station_name: 'Grill',
          stage_entered_at: new Date(now - 4 * 60000),
        },
        {
          id: 'i2',
          station_id: 'st1',
          station_name: 'Grill',
          stage_entered_at: new Date(now - 6 * 60000),
        },
      ]);

      const result = await service.calculateTempo('tenant-1');

      expect(result.tempoValue).toBe(5);
      expect(result.status).toBe('amber');
      expect(result.stationBreakdown).toHaveLength(1);
      expect(result.stationBreakdown[0].stationName).toBe('Grill');
      expect(result.stationBreakdown[0].ticketCount).toBe(2);
    });

    it('includes per-station breakdown', async () => {
      const now = Date.now();
      mockRepository.getActiveOrderItems.mockResolvedValue([
        {
          id: 'i1',
          station_id: 'st1',
          station_name: 'Grill',
          stage_entered_at: new Date(now - 3 * 60000),
        },
        {
          id: 'i2',
          station_id: 'st2',
          station_name: 'Sauté',
          stage_entered_at: new Date(now - 8 * 60000),
        },
      ]);

      const result = await service.calculateTempo('tenant-1');

      expect(result.stationBreakdown).toHaveLength(2);
      const grill = result.stationBreakdown.find(
        (s) => s.stationName === 'Grill',
      );
      const saute = result.stationBreakdown.find(
        (s) => s.stationName === 'Sauté',
      );
      expect(grill?.status).toBe('green');
      expect(saute?.status).toBe('amber');
    });
  });

  describe('bottleneck detection', () => {
    it('flags station with 2x the average of others as bottleneck', async () => {
      const now = Date.now();
      mockRepository.getActiveOrderItems.mockResolvedValue([
        {
          id: 'i1',
          station_id: 'st1',
          station_name: 'Grill',
          stage_entered_at: new Date(now - 3 * 60000),
        },
        {
          id: 'i2',
          station_id: 'st2',
          station_name: 'Sauté',
          stage_entered_at: new Date(now - 12 * 60000),
        },
      ]);

      const result = await service.calculateTempo('tenant-1');

      const saute = result.stationBreakdown.find(
        (s) => s.stationName === 'Sauté',
      );
      const grill = result.stationBreakdown.find(
        (s) => s.stationName === 'Grill',
      );
      expect(saute?.isBottleneck).toBe(true);
      expect(grill?.isBottleneck).toBe(false);
      expect(result.bottleneckStationIds).toContain('st2');
    });

    it('does not flag bottleneck with single station', async () => {
      const now = Date.now();
      mockRepository.getActiveOrderItems.mockResolvedValue([
        {
          id: 'i1',
          station_id: 'st1',
          station_name: 'Grill',
          stage_entered_at: new Date(now - 10 * 60000),
        },
      ]);

      const result = await service.calculateTempo('tenant-1');
      expect(result.bottleneckStationIds).toHaveLength(0);
    });
  });

  describe('recalculateAndEmit', () => {
    it('emits tempo.updated event', async () => {
      mockRepository.getActiveOrderItems.mockResolvedValue([]);

      await service.recalculateAndEmit('tenant-1');

      expect(mockEventBus.emit).toHaveBeenCalledWith(
        expect.objectContaining({
          event: 'tempo.updated',
          tenantId: 'tenant-1',
        }),
      );
    });
  });
});
