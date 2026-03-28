import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { SandboxService } from './sandbox.service';

@Injectable()
export class SandboxCleanupService {
  private readonly logger = new Logger(SandboxCleanupService.name);

  constructor(private readonly sandboxService: SandboxService) {}

  @Cron(CronExpression.EVERY_DAY_AT_3AM)
  async handleCleanup() {
    this.logger.log('Starting sandbox cleanup...');

    const inactive = await this.sandboxService.findInactiveSandboxes(7);

    this.logger.log(
      `Found ${inactive.length} inactive sandbox(es) to clean up`,
    );

    for (const sandbox of inactive) {
      try {
        await this.sandboxService.deleteSandbox(sandbox.id);
        this.logger.log(`Cleaned up sandbox ${sandbox.id} (${sandbox.name})`);
      } catch (error) {
        this.logger.error(
          `Failed to clean up sandbox ${sandbox.id}: ${error instanceof Error ? error.message : String(error)}`,
        );
      }
    }

    this.logger.log('Sandbox cleanup complete');
  }
}
