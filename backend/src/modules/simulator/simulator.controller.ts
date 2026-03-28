import {
  Controller,
  Post,
  Get,
  Body,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { SimulatorService } from './simulator.service';
import { CurrentUser, Roles, SkipTenantCheck } from '../../common/decorators';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('Simulator')
@Controller('simulator')
export class SimulatorController {
  constructor(private readonly service: SimulatorService) {}

  @Post('start')
  @Roles('system_admin', 'location_manager')
  @SkipTenantCheck()
  @HttpCode(HttpStatus.OK)
  async start(
    @CurrentUser('tenantId') tenantId: string,
    @Body() body: { pace: 'rush' | 'steady' | 'slow'; orderCount?: number },
  ) {
    return this.service.start(tenantId, body.pace ?? 'steady', body.orderCount);
  }

  @Post('stop')
  @Roles('system_admin', 'location_manager')
  @SkipTenantCheck()
  @HttpCode(HttpStatus.OK)
  stop(@CurrentUser('tenantId') tenantId: string) {
    return this.service.stop(tenantId);
  }

  @Get('status')
  @Roles('system_admin', 'location_manager')
  @SkipTenantCheck()
  status(@CurrentUser('tenantId') tenantId: string) {
    return this.service.getStatus(tenantId);
  }

  @Post('clear')
  @Roles('system_admin', 'location_manager')
  @SkipTenantCheck()
  @HttpCode(HttpStatus.OK)
  async clear(@CurrentUser('tenantId') tenantId: string) {
    return this.service.clearSimulatedData(tenantId);
  }
}
