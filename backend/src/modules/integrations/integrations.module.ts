import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { IntegrationsController } from './integrations.controller';
import { WebhookService } from './webhook.service';
import { WebhookDeliveryService } from './webhook-delivery.service';
import { IntegrationsApiKeysService } from './integrations-api-keys.service';
import { HmacAuthGuard } from '../../common/guards/hmac-auth.guard';

@Module({
  imports: [DatabaseModule],
  controllers: [IntegrationsController],
  providers: [
    WebhookService,
    WebhookDeliveryService,
    IntegrationsApiKeysService,
    HmacAuthGuard,
  ],
  exports: [WebhookDeliveryService, IntegrationsApiKeysService],
})
export class IntegrationsModule {}
