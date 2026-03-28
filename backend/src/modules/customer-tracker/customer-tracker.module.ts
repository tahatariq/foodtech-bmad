import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { CustomerTrackerService } from './customer-tracker.service';
import { CustomerTrackerController } from './customer-tracker.controller';
import { CustomerTrackerGateway } from './customer-tracker.gateway';

@Module({
  imports: [DatabaseModule],
  controllers: [CustomerTrackerController],
  providers: [CustomerTrackerService, CustomerTrackerGateway],
  exports: [CustomerTrackerService],
})
export class CustomerTrackerModule {}
