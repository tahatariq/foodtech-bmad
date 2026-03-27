import { Module } from '@nestjs/common';
import { TenantsService } from './tenants.service';
import { TenantsRepository } from './tenants.repository';
import { TierEnforcementService } from './tier-enforcement.service';
import { DatabaseModule } from '../../database/database.module';

@Module({
  imports: [DatabaseModule],
  providers: [TenantsService, TenantsRepository, TierEnforcementService],
  exports: [TenantsService, TierEnforcementService],
})
export class TenantsModule {}
