import { Controller, Get, Param } from '@nestjs/common';
import { CustomerTrackerService } from './customer-tracker.service';
import { Public } from '../../common/decorators/public.decorator';
import { SkipTenantCheck } from '../../common/decorators/skip-tenant-check.decorator';

@Controller('track')
@Public()
@SkipTenantCheck()
export class CustomerTrackerController {
  constructor(private readonly service: CustomerTrackerService) {}

  @Get(':token')
  async getOrderByToken(@Param('token') token: string) {
    const result = await this.service.findOrderByToken(token);

    if (!result || result.expired) {
      return { error: 'expired', message: 'This link has expired' };
    }

    return result;
  }
}
