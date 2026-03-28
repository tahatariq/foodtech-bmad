import {
  Controller,
  Post,
  Get,
  Delete,
  Param,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { SandboxService } from './sandbox.service';
import { Public, SkipTenantCheck } from '../../common/decorators';

@ApiTags('Sandbox')
@Controller('integrations/sandbox')
export class SandboxController {
  constructor(private readonly sandboxService: SandboxService) {}

  @Post()
  @Public()
  @SkipTenantCheck()
  @HttpCode(HttpStatus.CREATED)
  async provisionSandbox() {
    return this.sandboxService.provisionSandbox();
  }

  @Get(':tenantId/status')
  @Public()
  @SkipTenantCheck()
  async getSandboxStatus(@Param('tenantId') tenantId: string) {
    return this.sandboxService.getSandboxStatus(tenantId);
  }

  @Delete(':tenantId')
  @Public()
  @SkipTenantCheck()
  @HttpCode(HttpStatus.OK)
  async deleteSandbox(@Param('tenantId') tenantId: string) {
    return this.sandboxService.deleteSandbox(tenantId);
  }
}
