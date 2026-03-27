import { Module } from '@nestjs/common';
import { KitchenStatusController } from './kitchen-status.controller';
import { StationStatusController } from './station-status.controller';
import { KitchenStatusService } from './kitchen-status.service';
import { KitchenStatusRepository } from './kitchen-status.repository';
import { DatabaseModule } from '../../database/database.module';
import { GatewaysModule } from '../../gateways/gateways.module';

@Module({
  imports: [DatabaseModule, GatewaysModule],
  controllers: [KitchenStatusController, StationStatusController],
  providers: [KitchenStatusService, KitchenStatusRepository],
  exports: [KitchenStatusService],
})
export class KitchenStatusModule {}
