import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  UnauthorizedException,
  UsePipes,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { SupplierService } from './supplier.service';
import { SupplierRepository } from './supplier.repository';
import { Roles } from '../../common/decorators/roles.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { SkipTenantCheck } from '../../common/decorators/skip-tenant-check.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { TenantScoped } from '../../common/decorators/tenant-scoped.decorator';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import type { SupplierLoginDto } from './dto/supplier-login.dto';
import type { CreateSupplierLinkDto } from './dto/create-supplier-link.dto';
import {
  batchConfirmSchema,
  type BatchConfirmDto,
} from './dto/batch-confirm.dto';
import { batchRouteSchema, type BatchRouteDto } from './dto/batch-route.dto';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('Supplier')
@Controller()
export class SupplierController {
  constructor(
    private readonly supplierService: SupplierService,
    private readonly supplierRepository: SupplierRepository,
    private readonly jwtService: JwtService,
  ) {}

  // --- Supplier Auth ---

  @Public()
  @Post('auth/supplier/login')
  @HttpCode(HttpStatus.OK)
  async supplierLogin(@Body() dto: SupplierLoginDto) {
    const supplier = await this.supplierRepository.findSupplierByEmail(
      dto.email,
    );
    if (!supplier || !supplier.password_hash) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const isPasswordValid = await bcrypt.compare(
      dto.password,
      supplier.password_hash,
    );
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const accessToken = this.jwtService.sign({
      userId: supplier.id,
      supplierId: supplier.id,
      role: 'supplier',
      email: supplier.email,
      type: 'access',
      tenantId: 'supplier',
    });

    return { accessToken, supplierId: supplier.id };
  }

  // --- Supplier Endpoints ---

  @Get('supplier/restaurants')
  @Roles('supplier')
  @SkipTenantCheck()
  async getLinkedRestaurants(@CurrentUser('userId') supplierId: string) {
    return this.supplierService.getLinkedRestaurants(supplierId);
  }

  @Get('supplier/demand')
  @Roles('supplier')
  @SkipTenantCheck()
  async getDemandData(@CurrentUser('userId') supplierId: string) {
    return this.supplierService.getDemandData(supplierId);
  }

  @Get('supplier/orders')
  @Roles('supplier')
  @SkipTenantCheck()
  async getSupplierOrders(@CurrentUser('userId') supplierId: string) {
    return this.supplierService.getSupplierOrders(supplierId);
  }

  @Post('supplier/orders/batch-confirm')
  @Roles('supplier')
  @SkipTenantCheck()
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ZodValidationPipe(batchConfirmSchema))
  async batchConfirmOrders(
    @CurrentUser('userId') supplierId: string,
    @Body() dto: BatchConfirmDto,
  ) {
    return this.supplierService.batchConfirmOrders(supplierId, dto.orderIds);
  }

  @Post('supplier/orders/batch-route')
  @Roles('supplier')
  @SkipTenantCheck()
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ZodValidationPipe(batchRouteSchema))
  async batchRouteOrders(
    @CurrentUser('userId') supplierId: string,
    @Body() dto: BatchRouteDto,
  ) {
    return this.supplierService.batchRouteOrders(supplierId, dto.groups);
  }

  @Post('supplier/orders/:orderId/confirm')
  @Roles('supplier')
  @SkipTenantCheck()
  @HttpCode(HttpStatus.OK)
  async confirmOrder(
    @CurrentUser('userId') supplierId: string,
    @Param('orderId') orderId: string,
  ) {
    return this.supplierService.confirmOrder(supplierId, orderId);
  }

  @Get('supplier/trends')
  @Roles('supplier')
  @SkipTenantCheck()
  async getTrends(
    @CurrentUser('userId') supplierId: string,
    @Query('locationId') locationId?: string,
  ) {
    return this.supplierService.getTrends(supplierId, locationId);
  }

  // --- Kitchen Status: Supplier Orders ---

  @Get('kitchen-status/supplier-orders')
  @TenantScoped()
  async getSupplierOrdersForKitchen(@CurrentUser('tenantId') tenantId: string) {
    return this.supplierService.getActiveSupplierOrdersForLocation(tenantId);
  }

  // --- Admin Endpoints ---

  @Public()
  @SkipTenantCheck()
  @Roles('system_admin', 'org_owner')
  @Post('admin/supplier-links')
  async createSupplierLink(@Body() dto: CreateSupplierLinkDto) {
    return this.supplierService.createLink(dto.supplierId, dto.locationId);
  }

  @Public()
  @SkipTenantCheck()
  @Roles('system_admin', 'org_owner')
  @Delete('admin/supplier-links/:linkId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteSupplierLink(@Param('linkId') linkId: string) {
    await this.supplierService.deleteLink(linkId);
  }
}
