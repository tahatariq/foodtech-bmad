import { AdminService } from './admin.service';
import { ImportService } from './import.service';

describe('AdminService', () => {
  let service: AdminService;
  let mockDb: {
    transaction: jest.Mock;
    insert: jest.Mock;
  };
  let mockTx: {
    insert: jest.Mock;
  };

  beforeEach(() => {
    const returningMock = jest.fn();

    mockTx = {
      insert: jest.fn().mockReturnValue({
        values: jest.fn().mockReturnValue({
          returning: returningMock,
        }),
      }),
    };

    mockDb = {
      transaction: jest
        .fn()
        .mockImplementation(
          async (cb: (tx: typeof mockTx) => Promise<unknown>) => cb(mockTx),
        ),
      insert: jest.fn(),
    };

    service = new AdminService(mockDb as never);
  });

  it('should create tenant with org and location', async () => {
    const orgResult = {
      id: 'org-1',
      name: 'Test Restaurant',
      slug: 'test-restaurant',
      subscription_tier: 'indie',
    };
    const locationResult = {
      id: 'loc-1',
      organization_id: 'org-1',
      name: 'Test Restaurant - Main',
    };

    const returningMock1 = jest.fn().mockResolvedValue([orgResult]);
    const returningMock2 = jest.fn().mockResolvedValue([locationResult]);

    let callCount = 0;
    mockTx.insert.mockImplementation(() => ({
      values: jest.fn().mockImplementation(() => ({
        returning: (): unknown => {
          callCount++;
          return callCount === 1 ? returningMock1() : returningMock2();
        },
      })),
    }));

    const result = await service.createTenant({
      name: 'Test Restaurant',
      tier: 'indie',
    });

    expect(result.tenantId).toBe('loc-1');
    expect(result.orgId).toBe('org-1');
    expect(mockDb.transaction).toHaveBeenCalledTimes(1);
  });

  it('should activate tenant with stations and stages', async () => {
    const stationResults = [
      { id: 's1', name: 'Grill', emoji: null, display_order: 0 },
      { id: 's2', name: 'Salad', emoji: null, display_order: 1 },
    ];
    const stageResults = [
      { id: 'st1', name: 'received', sequence: 0 },
      { id: 'st2', name: 'preparing', sequence: 1 },
    ];

    let callCount = 0;
    mockTx.insert.mockImplementation(() => ({
      values: jest.fn().mockImplementation(() => ({
        returning: (): Promise<unknown> => {
          callCount++;
          return callCount === 1
            ? Promise.resolve(stationResults)
            : Promise.resolve(stageResults);
        },
      })),
    }));

    const result = await service.activateTenant('tenant-1', {
      stations: [{ name: 'Grill' }, { name: 'Salad' }],
      stages: [
        { name: 'received', sequence: 0 },
        { name: 'preparing', sequence: 1 },
      ],
    });

    expect(result.stations).toHaveLength(2);
    expect(result.stages).toHaveLength(2);
    expect(result.stations[0].name).toBe('Grill');
    expect(result.stages[0].name).toBe('received');
  });
});

describe('ImportService', () => {
  let importService: ImportService;
  let mockDb: {
    insert: jest.Mock;
  };

  beforeEach(() => {
    mockDb = {
      insert: jest.fn().mockReturnValue({
        values: jest.fn().mockReturnValue({
          onConflictDoNothing: jest.fn().mockResolvedValue(undefined),
        }),
      }),
    };
    importService = new ImportService(mockDb as never);
  });

  it('should validate menu items correctly', () => {
    const items = [
      { name: 'Burger', category: 'Mains' },
      { name: '', category: 'Invalid' },
      { name: 'Fries', reorderThreshold: 10 },
    ];

    const result = importService.validateMenuItems(items);

    expect(result.valid).toHaveLength(2);
    expect(result.invalid).toHaveLength(1);
    expect(result.invalid[0].index).toBe(1);
  });

  it('should validate items with missing name as invalid', () => {
    const items = [{ category: 'Mains' }];
    const result = importService.validateMenuItems(items);

    expect(result.valid).toHaveLength(0);
    expect(result.invalid).toHaveLength(1);
  });

  it('should execute import for valid items', async () => {
    const result = await importService.executeImport('tenant-1', [
      { name: 'Burger' },
      { name: 'Fries', reorderThreshold: 5, reorderQuantity: 20 },
    ]);

    expect(result.imported).toBe(2);
    expect(result.skipped).toBe(0);
    expect(mockDb.insert).toHaveBeenCalledTimes(2);
  });
});
