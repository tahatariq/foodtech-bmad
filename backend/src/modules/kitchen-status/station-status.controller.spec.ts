import { Test, TestingModule } from '@nestjs/testing';
import { StationStatusController } from './station-status.controller';
import { KitchenStatusService } from './kitchen-status.service';

describe('StationStatusController', () => {
  let controller: StationStatusController;
  let service: jest.Mocked<KitchenStatusService>;

  const tenantId = 'tenant-1';

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [StationStatusController],
      providers: [
        {
          provide: KitchenStatusService,
          useValue: {
            getAllStationStatuses: jest.fn(),
            createChecklist: jest.fn(),
            getChecklistByStation: jest.fn(),
            addChecklistItem: jest.fn(),
            toggleChecklistItem: jest.fn(),
            deleteChecklistItem: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get(StationStatusController);
    service = module.get(KitchenStatusService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getStationStatuses', () => {
    it('should return all station statuses', async () => {
      const statuses = [
        {
          stationId: 'st-1',
          stationName: 'Grill',
          status: 'green',
          statusColor: '#10B981',
          statusText: 'Flowing',
          ticketCount: 0,
          maxTicketAgeMs: 0,
          checklistCompletion: 100,
        },
      ];
      service.getAllStationStatuses.mockResolvedValue(statuses as any);

      const result = await controller.getStationStatuses(tenantId);

      expect(service.getAllStationStatuses).toHaveBeenCalledWith(tenantId);
      expect(result).toEqual(statuses);
    });

    it('should return empty array when no stations', async () => {
      service.getAllStationStatuses.mockResolvedValue([]);

      const result = await controller.getStationStatuses(tenantId);

      expect(result).toEqual([]);
    });
  });

  describe('createChecklist', () => {
    it('should create a checklist', async () => {
      const dto = {
        stationId: 'st-1',
        name: 'Morning Prep',
        items: [{ description: 'Prep sauces' }],
      };
      const created = {
        id: 'cl-1',
        station_id: 'st-1',
        name: 'Morning Prep',
        items: [
          { id: 'ci-1', description: 'Prep sauces', is_completed: false },
        ],
      };
      service.createChecklist.mockResolvedValue(created as any);

      const result = await controller.createChecklist(tenantId, dto);

      expect(service.createChecklist).toHaveBeenCalledWith(tenantId, dto);
      expect(result).toEqual(created);
    });
  });

  describe('getChecklist', () => {
    it('should return checklist for station', async () => {
      const checklist = {
        id: 'cl-1',
        station_id: 'st-1',
        name: 'Morning Prep',
        items: [],
      };
      service.getChecklistByStation.mockResolvedValue(checklist as any);

      const result = await controller.getChecklist(tenantId, 'st-1');

      expect(service.getChecklistByStation).toHaveBeenCalledWith(
        tenantId,
        'st-1',
      );
      expect(result).toEqual(checklist);
    });

    it('should return null when no checklist for station', async () => {
      service.getChecklistByStation.mockResolvedValue(null);

      const result = await controller.getChecklist(tenantId, 'st-1');

      expect(result).toBeNull();
    });
  });

  describe('addChecklistItem', () => {
    it('should add item to checklist', async () => {
      const item = {
        id: 'ci-1',
        description: 'Stock station',
        is_completed: false,
      };
      service.addChecklistItem.mockResolvedValue(item as any);

      const result = await controller.addChecklistItem('cl-1', {
        description: 'Stock station',
      });

      expect(service.addChecklistItem).toHaveBeenCalledWith(
        'cl-1',
        'Stock station',
      );
      expect(result).toEqual(item);
    });
  });

  describe('toggleChecklistItem', () => {
    it('should toggle checklist item to completed', async () => {
      const toggleResult = {
        item: { id: 'ci-1', is_completed: true },
        allComplete: false,
      };
      service.toggleChecklistItem.mockResolvedValue(toggleResult as any);

      const result = await controller.toggleChecklistItem(
        tenantId,
        'user-1',
        'cl-1',
        'ci-1',
        { isCompleted: true },
      );

      expect(service.toggleChecklistItem).toHaveBeenCalledWith(
        tenantId,
        'cl-1',
        'ci-1',
        true,
        'user-1',
      );
      expect(result).toEqual(toggleResult);
    });

    it('should toggle checklist item to not completed', async () => {
      const toggleResult = {
        item: { id: 'ci-1', is_completed: false },
        allComplete: false,
      };
      service.toggleChecklistItem.mockResolvedValue(toggleResult as any);

      const result = await controller.toggleChecklistItem(
        tenantId,
        'user-1',
        'cl-1',
        'ci-1',
        { isCompleted: false },
      );

      expect(service.toggleChecklistItem).toHaveBeenCalledWith(
        tenantId,
        'cl-1',
        'ci-1',
        false,
        'user-1',
      );
      expect(result).toEqual(toggleResult);
    });

    it('should return null when item not found', async () => {
      service.toggleChecklistItem.mockResolvedValue(null);

      const result = await controller.toggleChecklistItem(
        tenantId,
        'user-1',
        'cl-1',
        'ci-nonexistent',
        { isCompleted: true },
      );

      expect(result).toBeNull();
    });
  });

  describe('deleteChecklistItem', () => {
    it('should delete checklist item', async () => {
      service.deleteChecklistItem.mockResolvedValue(undefined);

      await controller.deleteChecklistItem('ci-1');

      expect(service.deleteChecklistItem).toHaveBeenCalledWith('ci-1');
    });
  });
});
