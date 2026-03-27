import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  Query,
  UsePipes,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { OrdersService } from './orders.service';
import { CurrentUser, TenantScoped, Roles } from '../../common/decorators';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { createOrderSchema, type CreateOrderDto } from './dto/create-order.dto';

@Controller('orders')
@TenantScoped()
export class OrdersController {
  constructor(private readonly service: OrdersService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UsePipes(new ZodValidationPipe(createOrderSchema))
  async createOrder(
    @CurrentUser('tenantId') tenantId: string,
    @Body() dto: CreateOrderDto,
  ) {
    return this.service.createOrder(tenantId, dto);
  }

  @Post(':orderId/bump')
  @Roles('line_cook', 'head_chef')
  @HttpCode(HttpStatus.OK)
  async bumpOrder(
    @CurrentUser('tenantId') tenantId: string,
    @Param('orderId') orderId: string,
  ) {
    return this.service.bumpOrder(tenantId, orderId);
  }

  @Get()
  async findOrders(
    @CurrentUser('tenantId') tenantId: string,
    @Query('stationId') stationId?: string,
  ) {
    return this.service.findOrders(tenantId, stationId);
  }

  @Post(':orderId/reassign')
  @Roles('head_chef', 'location_manager')
  @HttpCode(HttpStatus.OK)
  async reassignOrder(
    @CurrentUser('tenantId') tenantId: string,
    @Param('orderId') orderId: string,
    @Body() body: { targetStationId: string },
  ) {
    return this.service.reassignOrder(tenantId, orderId, body.targetStationId);
  }

  @Post(':orderId/revert')
  @Roles('head_chef', 'location_manager')
  @HttpCode(HttpStatus.OK)
  async revertOrder(
    @CurrentUser('tenantId') tenantId: string,
    @Param('orderId') orderId: string,
  ) {
    return this.service.revertOrder(tenantId, orderId);
  }
}
