import {
  Controller,
  Post,
  Get,
  Delete,
  Param,
  Body,
  UsePipes,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { AdminService } from './admin.service';
import { ApiKeysService } from './api-keys.service';
import { ImportService } from './import.service';
import { MetricsService } from './metrics.service';
import { Public, SkipTenantCheck, Roles } from '../../common/decorators';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import {
  createTenantSchema,
  type CreateTenantDto,
} from './dto/create-tenant.dto';
import {
  activateTenantSchema,
  type ActivateTenantDto,
} from './dto/activate-tenant.dto';
import { importMenuSchema, type ImportMenuDto } from './dto/import-menu.dto';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('Admin')
@Controller('admin')
export class AdminController {
  constructor(
    private readonly adminService: AdminService,
    private readonly apiKeysService: ApiKeysService,
    private readonly importService: ImportService,
    private readonly metricsService: MetricsService,
  ) {}

  @Post('tenants')
  @Public()
  @SkipTenantCheck()
  @HttpCode(HttpStatus.CREATED)
  @UsePipes(new ZodValidationPipe(createTenantSchema))
  async createTenant(@Body() dto: CreateTenantDto) {
    return this.adminService.createTenant(dto);
  }

  @Post('tenants/:tenantId/activate')
  @Roles('system_admin')
  @SkipTenantCheck()
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ZodValidationPipe(activateTenantSchema))
  async activateTenant(
    @Param('tenantId') tenantId: string,
    @Body() dto: ActivateTenantDto,
  ) {
    return this.adminService.activateTenant(tenantId, dto);
  }

  @Post('tenants/:tenantId/import/menu')
  @Roles('system_admin')
  @SkipTenantCheck()
  @HttpCode(HttpStatus.OK)
  validateMenuImport(@Body() body: { items: unknown[] }) {
    return this.importService.validateMenuItems(body.items ?? []);
  }

  @Post('tenants/:tenantId/import/menu/execute')
  @Roles('system_admin')
  @SkipTenantCheck()
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ZodValidationPipe(importMenuSchema))
  async executeMenuImport(
    @Param('tenantId') tenantId: string,
    @Body() dto: ImportMenuDto,
  ) {
    return this.importService.executeImport(tenantId, dto.items);
  }

  @Post('tenants/:tenantId/api-keys')
  @Roles('system_admin')
  @SkipTenantCheck()
  @HttpCode(HttpStatus.CREATED)
  async generateApiKey(@Param('tenantId') tenantId: string) {
    return this.apiKeysService.generateKeyPair(tenantId);
  }

  @Get('tenants/:tenantId/api-keys')
  @Roles('system_admin')
  @SkipTenantCheck()
  async listApiKeys(@Param('tenantId') tenantId: string) {
    return this.apiKeysService.listKeys(tenantId);
  }

  @Delete('tenants/:tenantId/api-keys/:keyId')
  @Roles('system_admin')
  @SkipTenantCheck()
  @HttpCode(HttpStatus.OK)
  async revokeApiKey(@Param('keyId') keyId: string) {
    return this.apiKeysService.revokeKey(keyId);
  }

  @Get('metrics/adoption')
  @Roles('system_admin')
  @SkipTenantCheck()
  async getAdoptionMetrics() {
    return this.metricsService.getAdoptionMetrics();
  }
}
