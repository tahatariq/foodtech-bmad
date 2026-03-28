import {
  Controller,
  Post,
  Get,
  Delete,
  Patch,
  Param,
  Body,
  UsePipes,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { WebhookService } from './webhook.service';
import { WebhookDeliveryService } from './webhook-delivery.service';
import { IntegrationsApiKeysService } from './integrations-api-keys.service';
import { Roles, SkipTenantCheck } from '../../common/decorators';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import {
  createWebhookSchema,
  type CreateWebhookDto,
} from './dto/create-webhook.dto';
import {
  updateWebhookSchema,
  type UpdateWebhookDto,
} from './dto/update-webhook.dto';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('Integrations')
@Controller('integrations')
@Roles('system_admin', 'location_manager')
@SkipTenantCheck()
export class IntegrationsController {
  constructor(
    private readonly webhookService: WebhookService,
    private readonly webhookDeliveryService: WebhookDeliveryService,
    private readonly apiKeysService: IntegrationsApiKeysService,
  ) {}

  // ── Webhook endpoints ──────────────────────────────────────────────

  @Post('webhooks')
  @HttpCode(HttpStatus.CREATED)
  @UsePipes(new ZodValidationPipe(createWebhookSchema))
  async createWebhook(@Body() dto: CreateWebhookDto) {
    // tenantId would normally come from the request context;
    // for now we accept it as a query/body param or from the user object
    return this.webhookService.createSubscription(
      'default-tenant',
      dto.url,
      dto.events,
    );
  }

  @Post(':tenantId/webhooks')
  @HttpCode(HttpStatus.CREATED)
  async createWebhookForTenant(
    @Param('tenantId') tenantId: string,
    @Body(new ZodValidationPipe(createWebhookSchema)) dto: CreateWebhookDto,
  ) {
    return this.webhookService.createSubscription(
      tenantId,
      dto.url,
      dto.events,
    );
  }

  @Get(':tenantId/webhooks')
  async listWebhooks(@Param('tenantId') tenantId: string) {
    return this.webhookService.listSubscriptions(tenantId);
  }

  @Delete('webhooks/:id')
  @HttpCode(HttpStatus.OK)
  async deactivateWebhook(@Param('id') id: string) {
    return this.webhookService.deactivateSubscription(id);
  }

  @Patch('webhooks/:id')
  async updateWebhook(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(updateWebhookSchema)) dto: UpdateWebhookDto,
  ) {
    return this.webhookService.updateSubscription(id, dto);
  }

  @Get(':tenantId/webhooks/dead-letter')
  async getDeadLetters(@Param('tenantId') tenantId: string) {
    return this.webhookService.getDeadLetters(tenantId);
  }

  @Post('webhooks/dead-letter/:id/retry')
  @HttpCode(HttpStatus.OK)
  async retryDeadLetter(@Param('id') id: string) {
    await this.webhookDeliveryService.retryDeadLetter(id);
    return { id, retried: true };
  }

  // ── API Key endpoints ──────────────────────────────────────────────

  @Post(':tenantId/api-keys')
  @HttpCode(HttpStatus.CREATED)
  async generateApiKey(@Param('tenantId') tenantId: string) {
    return this.apiKeysService.generateKeyPair(tenantId);
  }

  @Get(':tenantId/api-keys')
  async listApiKeys(@Param('tenantId') tenantId: string) {
    return this.apiKeysService.listKeys(tenantId);
  }

  @Delete('api-keys/:keyId')
  @HttpCode(HttpStatus.OK)
  async revokeApiKey(@Param('keyId') keyId: string) {
    return this.apiKeysService.revokeKey(keyId);
  }

  @Post(':tenantId/api-keys/:keyId/rotate')
  @HttpCode(HttpStatus.OK)
  async rotateApiKey(
    @Param('tenantId') tenantId: string,
    @Param('keyId') keyId: string,
  ) {
    return this.apiKeysService.rotateKey(keyId, tenantId);
  }
}
