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
import { KitchenStatusService } from './kitchen-status.service';
import { CurrentUser, TenantScoped, Roles } from '../../common/decorators';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import {
  createInventoryItemSchema,
  type CreateInventoryItemDto,
} from './dto/create-inventory-item.dto';
import {
  updateInventorySchema,
  type UpdateInventoryDto,
} from './dto/update-inventory.dto';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('Kitchen Status')
@Controller('inventory-items')
@TenantScoped()
export class KitchenStatusController {
  constructor(private readonly service: KitchenStatusService) {}

  @Post()
  @Roles('location_manager')
  @HttpCode(HttpStatus.CREATED)
  @UsePipes(new ZodValidationPipe(createInventoryItemSchema))
  async createItem(
    @CurrentUser('tenantId') tenantId: string,
    @Body() dto: CreateInventoryItemDto,
  ) {
    return this.service.createItem(tenantId, dto);
  }

  @Get()
  async findAll(@CurrentUser('tenantId') tenantId: string) {
    return this.service.findAll(tenantId);
  }

  @Get('86d')
  async find86d(@CurrentUser('tenantId') tenantId: string) {
    return this.service.find86dItems(tenantId);
  }

  @Get(':id')
  async findOne(
    @CurrentUser('tenantId') tenantId: string,
    @Param('id') id: string,
  ) {
    return this.service.findById(tenantId, id);
  }

  @Patch(':id')
  @Roles('location_manager', 'head_chef')
  @UsePipes(new ZodValidationPipe(updateInventorySchema))
  async updateItem(
    @CurrentUser('tenantId') tenantId: string,
    @Param('id') id: string,
    @Body() dto: UpdateInventoryDto,
  ) {
    return this.service.updateItem(tenantId, id, dto);
  }
}
