import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { SandboxController } from './sandbox.controller';
import { SandboxService } from './sandbox.service';
import { SandboxCleanupService } from './sandbox-cleanup.service';

@Module({
  imports: [DatabaseModule],
  controllers: [SandboxController],
  providers: [SandboxService, SandboxCleanupService],
  exports: [SandboxService],
})
export class SandboxModule {}
