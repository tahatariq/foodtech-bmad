import { SandboxCleanupService } from './sandbox-cleanup.service';
import { SandboxService } from './sandbox.service';

describe('SandboxCleanupService', () => {
  let cleanupService: SandboxCleanupService;
  let mockSandboxService: {
    findInactiveSandboxes: jest.Mock;
    deleteSandbox: jest.Mock;
  };

  beforeEach(() => {
    mockSandboxService = {
      findInactiveSandboxes: jest.fn(),
      deleteSandbox: jest.fn(),
    };

    cleanupService = new SandboxCleanupService(
      mockSandboxService as unknown as SandboxService,
    );
  });

  it('should delete inactive sandboxes older than 7 days', async () => {
    const inactiveSandboxes = [
      {
        id: 'sb-1',
        name: 'Sandbox-old1',
        last_activity_at: new Date('2025-01-01'),
      },
      {
        id: 'sb-2',
        name: 'Sandbox-old2',
        last_activity_at: new Date('2025-01-02'),
      },
    ];

    mockSandboxService.findInactiveSandboxes.mockResolvedValue(
      inactiveSandboxes,
    );
    mockSandboxService.deleteSandbox.mockResolvedValue({ deleted: true });

    await cleanupService.handleCleanup();

    expect(mockSandboxService.findInactiveSandboxes).toHaveBeenCalledWith(7);
    expect(mockSandboxService.deleteSandbox).toHaveBeenCalledTimes(2);
    expect(mockSandboxService.deleteSandbox).toHaveBeenCalledWith('sb-1');
    expect(mockSandboxService.deleteSandbox).toHaveBeenCalledWith('sb-2');
  });

  it('should keep active sandboxes (none returned by findInactive)', async () => {
    mockSandboxService.findInactiveSandboxes.mockResolvedValue([]);

    await cleanupService.handleCleanup();

    expect(mockSandboxService.findInactiveSandboxes).toHaveBeenCalledWith(7);
    expect(mockSandboxService.deleteSandbox).not.toHaveBeenCalled();
  });

  it('should continue cleanup when individual delete fails', async () => {
    const inactiveSandboxes = [
      {
        id: 'sb-1',
        name: 'Sandbox-fail',
        last_activity_at: new Date('2025-01-01'),
      },
      {
        id: 'sb-2',
        name: 'Sandbox-ok',
        last_activity_at: new Date('2025-01-02'),
      },
    ];

    mockSandboxService.findInactiveSandboxes.mockResolvedValue(
      inactiveSandboxes,
    );
    mockSandboxService.deleteSandbox
      .mockRejectedValueOnce(new Error('DB error'))
      .mockResolvedValueOnce({ deleted: true });

    await cleanupService.handleCleanup();

    expect(mockSandboxService.deleteSandbox).toHaveBeenCalledTimes(2);
  });
});
