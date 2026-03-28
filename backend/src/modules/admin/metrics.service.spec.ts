import { MetricsService } from './metrics.service';

describe('MetricsService', () => {
  let service: MetricsService;

  describe('getAdoptionMetrics', () => {
    it('should return correct metrics for a location', async () => {
      const now = new Date();
      const fiveDaysAgo = new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000);

      let dbCallCount = 0;
      let countCallCount = 0;
      const db = {
        select: jest.fn().mockImplementation(() => {
          dbCallCount++;
          if (dbCallCount === 1) {
            return {
              from: jest.fn().mockReturnValue({
                innerJoin: jest.fn().mockReturnValue({
                  where: jest.fn().mockResolvedValue([
                    {
                      locationId: 'loc-1',
                      locationName: 'Main',
                      orgName: 'Test Org',
                      createdAt: fiveDaysAgo,
                    },
                  ]),
                }),
              }),
            };
          }
          return {
            from: jest.fn().mockReturnValue({
              where: jest.fn().mockImplementation((): Promise<unknown[]> => {
                countCallCount++;
                if (countCallCount === 1)
                  return Promise.resolve([{ value: 10 }]);
                if (countCallCount === 2)
                  return Promise.resolve([{ value: 3 }]);
                if (countCallCount === 3)
                  return Promise.resolve([{ value: 2 }]);
                return Promise.resolve([{ value: 0 }]);
              }),
            }),
          };
        }),
      };

      service = new MetricsService(db as never);
      const metrics = await service.getAdoptionMetrics();

      expect(metrics).toHaveLength(1);
      expect(metrics[0].tenantId).toBe('loc-1');
      expect(metrics[0].tenantName).toBe('Test Org - Main');
      expect(metrics[0].bumpUsageRate).toBe(30);
      expect(metrics[0].activeUsersPerDay).toBe(2);
      expect(metrics[0].daysSinceOnboarding).toBeGreaterThanOrEqual(4);
      expect(metrics[0].flagged).toBe(true);
    });

    it('should not flag tenants with high usage', async () => {
      const now = new Date();
      const fiveDaysAgo = new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000);

      let dbCallCount = 0;
      let countCallCount = 0;
      const db = {
        select: jest.fn().mockImplementation(() => {
          dbCallCount++;
          if (dbCallCount === 1) {
            return {
              from: jest.fn().mockReturnValue({
                innerJoin: jest.fn().mockReturnValue({
                  where: jest.fn().mockResolvedValue([
                    {
                      locationId: 'loc-1',
                      locationName: 'Main',
                      orgName: 'Good Org',
                      createdAt: fiveDaysAgo,
                    },
                  ]),
                }),
              }),
            };
          }
          return {
            from: jest.fn().mockReturnValue({
              where: jest.fn().mockImplementation((): Promise<unknown[]> => {
                countCallCount++;
                if (countCallCount === 1)
                  return Promise.resolve([{ value: 10 }]);
                if (countCallCount === 2)
                  return Promise.resolve([{ value: 8 }]);
                if (countCallCount === 3)
                  return Promise.resolve([{ value: 5 }]);
                return Promise.resolve([{ value: 0 }]);
              }),
            }),
          };
        }),
      };

      service = new MetricsService(db as never);
      const metrics = await service.getAdoptionMetrics();

      expect(metrics).toHaveLength(1);
      expect(metrics[0].bumpUsageRate).toBe(80);
      expect(metrics[0].flagged).toBe(false);
    });

    it('should not flag tenants onboarded less than 3 days ago', async () => {
      const now = new Date();
      const oneDayAgo = new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000);

      let dbCallCount = 0;
      let countCallCount = 0;
      const db = {
        select: jest.fn().mockImplementation(() => {
          dbCallCount++;
          if (dbCallCount === 1) {
            return {
              from: jest.fn().mockReturnValue({
                innerJoin: jest.fn().mockReturnValue({
                  where: jest.fn().mockResolvedValue([
                    {
                      locationId: 'loc-1',
                      locationName: 'Main',
                      orgName: 'New Org',
                      createdAt: oneDayAgo,
                    },
                  ]),
                }),
              }),
            };
          }
          return {
            from: jest.fn().mockReturnValue({
              where: jest.fn().mockImplementation((): Promise<unknown[]> => {
                countCallCount++;
                if (countCallCount === 1)
                  return Promise.resolve([{ value: 2 }]);
                if (countCallCount === 2)
                  return Promise.resolve([{ value: 0 }]);
                if (countCallCount === 3)
                  return Promise.resolve([{ value: 1 }]);
                return Promise.resolve([{ value: 0 }]);
              }),
            }),
          };
        }),
      };

      service = new MetricsService(db as never);
      const metrics = await service.getAdoptionMetrics();

      expect(metrics).toHaveLength(1);
      expect(metrics[0].bumpUsageRate).toBe(0);
      expect(metrics[0].daysSinceOnboarding).toBeLessThanOrEqual(2);
      expect(metrics[0].flagged).toBe(false);
    });

    it('should return empty array when no locations exist', async () => {
      const db = {
        select: jest.fn().mockReturnValue({
          from: jest.fn().mockReturnValue({
            innerJoin: jest.fn().mockReturnValue({
              where: jest.fn().mockResolvedValue([]),
            }),
          }),
        }),
      };

      service = new MetricsService(db as never);
      const metrics = await service.getAdoptionMetrics();

      expect(metrics).toHaveLength(0);
    });
  });
});
