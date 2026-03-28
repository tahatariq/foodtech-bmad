import {
  Controller,
  Post,
  Get,
  Patch,
  Delete,
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
  createChecklistSchema,
  addChecklistItemSchema,
  toggleChecklistItemSchema,
  type CreateChecklistDto,
  type AddChecklistItemDto,
  type ToggleChecklistItemDto,
} from './dto/create-checklist.dto';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('Kitchen Status')
@Controller('kitchen-status')
@TenantScoped()
export class StationStatusController {
  constructor(private readonly service: KitchenStatusService) {}

  @Get('stations')
  async getStationStatuses(@CurrentUser('tenantId') tenantId: string) {
    return this.service.getAllStationStatuses(tenantId);
  }

  @Post('checklists')
  @Roles('location_manager')
  @HttpCode(HttpStatus.CREATED)
  @UsePipes(new ZodValidationPipe(createChecklistSchema))
  async createChecklist(
    @CurrentUser('tenantId') tenantId: string,
    @Body() dto: CreateChecklistDto,
  ) {
    return this.service.createChecklist(tenantId, dto);
  }

  @Get('checklists/:stationId')
  async getChecklist(
    @CurrentUser('tenantId') tenantId: string,
    @Param('stationId') stationId: string,
  ) {
    return this.service.getChecklistByStation(tenantId, stationId);
  }

  @Post('checklists/:checklistId/items')
  @Roles('location_manager')
  @HttpCode(HttpStatus.CREATED)
  @UsePipes(new ZodValidationPipe(addChecklistItemSchema))
  async addChecklistItem(
    @Param('checklistId') checklistId: string,
    @Body() dto: AddChecklistItemDto,
  ) {
    return this.service.addChecklistItem(checklistId, dto.description);
  }

  @Patch('checklists/:checklistId/items/:itemId')
  @UsePipes(new ZodValidationPipe(toggleChecklistItemSchema))
  async toggleChecklistItem(
    @CurrentUser('tenantId') tenantId: string,
    @CurrentUser('userId') userId: string,
    @Param('checklistId') checklistId: string,
    @Param('itemId') itemId: string,
    @Body() dto: ToggleChecklistItemDto,
  ) {
    return this.service.toggleChecklistItem(
      tenantId,
      checklistId,
      itemId,
      dto.isCompleted,
      userId,
    );
  }

  @Delete('checklists/:checklistId/items/:itemId')
  @Roles('location_manager')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteChecklistItem(@Param('itemId') itemId: string) {
    await this.service.deleteChecklistItem(itemId);
  }
}
