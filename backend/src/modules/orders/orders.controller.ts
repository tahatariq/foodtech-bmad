import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  Query,
  Res,
  UsePipes,
  HttpCode,
  HttpStatus,
  NotFoundException,
} from '@nestjs/common';
import type { Response } from 'express';
import * as QRCode from 'qrcode';
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

  @Get(':orderId/qr')
  @Roles('line_cook', 'head_chef', 'location_manager')
  async getOrderQr(
    @CurrentUser('tenantId') tenantId: string,
    @Param('orderId') orderId: string,
    @Res() res: Response,
  ) {
    const order = await this.service.getOrderTrackingUrl(tenantId, orderId);
    if (!order) {
      throw new NotFoundException({
        type: 'https://foodtech.app/errors/not-found',
        title: 'Order Not Found',
        status: 404,
        detail: `Order ${orderId} not found.`,
      });
    }

    const buffer = await QRCode.toBuffer(order.trackingUrl, { type: 'png' });
    res.set('Content-Type', 'image/png');
    res.send(buffer);
  }
}
