import {
  Controller,
  Post,
  Get,
  Patch,
  Param,
  Body,
  UsePipes,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { StationsService } from './stations.service';
import { Roles, CurrentUser, TenantScoped } from '../../common/decorators';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import {
  createStationSchema,
  type CreateStationDto,
} from './dto/create-station.dto';
import {
  createOrderStagesSchema,
  type CreateOrderStagesDto,
} from './dto/create-order-stages.dto';
import {
  updateStageThresholdsSchema,
  type UpdateStageThresholdsDto,
} from './dto/update-stage-thresholds.dto';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('Stations')
@Controller('stations')
@TenantScoped()
export class StationsController {
  constructor(private readonly service: StationsService) {}

  @Post()
  @Roles('location_manager')
  @HttpCode(HttpStatus.CREATED)
  @UsePipes(new ZodValidationPipe(createStationSchema))
  async createStation(
    @CurrentUser('tenantId') tenantId: string,
    @Body() dto: CreateStationDto,
  ) {
    return this.service.createStation(tenantId, dto);
  }

  @Get()
  async findAll(@CurrentUser('tenantId') tenantId: string) {
    return this.service.findAllStations(tenantId);
  }
}

@Controller('order-stages')
@TenantScoped()
export class OrderStagesController {
  constructor(private readonly service: StationsService) {}

  @Post()
  @Roles('location_manager')
  @HttpCode(HttpStatus.CREATED)
  @UsePipes(new ZodValidationPipe(createOrderStagesSchema))
  async createOrderStages(
    @CurrentUser('tenantId') tenantId: string,
    @Body() dto: CreateOrderStagesDto,
  ) {
    return this.service.createOrderStages(tenantId, dto);
  }

  @Get()
  async findAll(@CurrentUser('tenantId') tenantId: string) {
    return this.service.findOrderStages(tenantId);
  }

  @Patch(':stageId')
  @Roles('location_manager')
  @UsePipes(new ZodValidationPipe(updateStageThresholdsSchema))
  async updateThresholds(
    @CurrentUser('tenantId') tenantId: string,
    @Param('stageId') stageId: string,
    @Body() dto: UpdateStageThresholdsDto,
  ) {
    return this.service.updateStageThresholds(tenantId, stageId, dto);
  }
}
