import {
  Controller,
  Get,
  Post,
  Param,
  Headers,
  UnauthorizedException,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { DeliveryService } from './delivery.service';
import { Public } from '../../common/decorators/public.decorator';
import { SkipTenantCheck } from '../../common/decorators/skip-tenant-check.decorator';

@Controller('delivery')
@Public()
@SkipTenantCheck()
export class DeliveryController {
  constructor(private readonly service: DeliveryService) {}

  @Get('orders')
  async getDeliveryOrders(@Headers('x-api-key') apiKey: string) {
    const tenantId = await this.service.validateApiKey(apiKey);
    if (!tenantId) {
      throw new UnauthorizedException({
        type: 'https://foodtech.app/errors/unauthorized',
        title: 'Unauthorized',
        status: 401,
        detail: 'Invalid API key.',
      });
    }
    return this.service.getDeliveryOrders(tenantId);
  }

  @Post('orders/:orderId/pickup')
  @HttpCode(HttpStatus.OK)
  async pickupOrder(
    @Headers('x-api-key') apiKey: string,
    @Param('orderId') orderId: string,
  ) {
    const tenantId = await this.service.validateApiKey(apiKey);
    if (!tenantId) {
      throw new UnauthorizedException({
        type: 'https://foodtech.app/errors/unauthorized',
        title: 'Unauthorized',
        status: 401,
        detail: 'Invalid API key.',
      });
    }
    return this.service.pickupOrder(tenantId, orderId);
  }
}
