import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { createHash, createHmac } from 'crypto';
import { Request } from 'express';
import { IntegrationsApiKeysService } from '../../modules/integrations/integrations-api-keys.service';

@Injectable()
export class HmacAuthGuard implements CanActivate {
  constructor(private readonly apiKeysService: IntegrationsApiKeysService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const apiKey = request.headers['x-foodtech-key'] as string | undefined;
    const signature = request.headers['x-foodtech-signature'] as
      | string
      | undefined;

    if (!apiKey) {
      throw new UnauthorizedException({
        type: 'https://foodtech.app/errors/unauthorized',
        title: 'Unauthorized',
        status: 401,
        detail: 'Missing X-FoodTech-Key header.',
      });
    }

    if (!signature) {
      throw new UnauthorizedException({
        type: 'https://foodtech.app/errors/unauthorized',
        title: 'Unauthorized',
        status: 401,
        detail: 'Missing X-FoodTech-Signature header.',
      });
    }

    const keyHash = createHash('sha256').update(apiKey).digest('hex');
    const keyRecord = await this.apiKeysService.validateApiKey(keyHash);

    if (!keyRecord) {
      throw new UnauthorizedException({
        type: 'https://foodtech.app/errors/unauthorized',
        title: 'Unauthorized',
        status: 401,
        detail: 'Invalid API key.',
      });
    }

    // Compute HMAC of request body using the stored secret_hash as the key
    const body =
      typeof request.body === 'string'
        ? request.body
        : JSON.stringify(request.body ?? '');

    const expectedSignature = createHmac('sha256', keyRecord.secret_hash)
      .update(body)
      .digest('hex');

    if (signature !== expectedSignature) {
      throw new UnauthorizedException({
        type: 'https://foodtech.app/errors/unauthorized',
        title: 'Unauthorized',
        status: 401,
        detail: 'Invalid HMAC signature.',
      });
    }

    // Set tenant context on request
    (request as unknown as Record<string, unknown>)['tenantId'] =
      keyRecord.tenant_id;

    return true;
  }
}
