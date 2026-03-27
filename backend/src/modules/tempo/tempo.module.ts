import { Module } from '@nestjs/common';
import { TempoController } from './tempo.controller';
import { TempoService } from './tempo.service';
import { TempoRepository } from './tempo.repository';
import { DatabaseModule } from '../../database/database.module';
import { GatewaysModule } from '../../gateways/gateways.module';

@Module({
  imports: [DatabaseModule, GatewaysModule],
  controllers: [TempoController],
  providers: [TempoService, TempoRepository],
  exports: [TempoService],
})
export class TempoModule {}
