import { Controller, Get } from '@nestjs/common';
import { TempoService } from './tempo.service';
import { CurrentUser, TenantScoped, Roles } from '../../common/decorators';

@Controller('tempo')
@TenantScoped()
export class TempoController {
  constructor(private readonly service: TempoService) {}

  @Get()
  @Roles('head_chef', 'location_manager')
  async getTempo(@CurrentUser('tenantId') tenantId: string) {
    return this.service.calculateTempo(tenantId);
  }
}
