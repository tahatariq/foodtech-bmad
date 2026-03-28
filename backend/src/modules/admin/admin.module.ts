import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { OrganizationsController } from './organizations.controller';
import { AdminService } from './admin.service';
import { ApiKeysService } from './api-keys.service';
import { ImportService } from './import.service';
import { MetricsService } from './metrics.service';
import { DatabaseModule } from '../../database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [AdminController, OrganizationsController],
  providers: [AdminService, ApiKeysService, ImportService, MetricsService],
  exports: [AdminService],
})
export class AdminModule {}
