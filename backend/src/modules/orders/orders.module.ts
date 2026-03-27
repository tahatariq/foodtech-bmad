import { Module } from '@nestjs/common';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';
import { OrdersRepository } from './orders.repository';
import { DatabaseModule } from '../../database/database.module';
import { GatewaysModule } from '../../gateways/gateways.module';
import { KitchenStatusModule } from '../kitchen-status/kitchen-status.module';

@Module({
  imports: [DatabaseModule, GatewaysModule, KitchenStatusModule],
  controllers: [OrdersController],
  providers: [OrdersService, OrdersRepository],
  exports: [OrdersService, OrdersRepository],
})
export class OrdersModule {}
