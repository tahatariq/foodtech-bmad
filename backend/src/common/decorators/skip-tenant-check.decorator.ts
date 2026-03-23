import { SetMetadata } from '@nestjs/common';

export const SKIP_TENANT_CHECK_KEY = 'SKIP_TENANT_CHECK';

export const SkipTenantCheck = () => SetMetadata(SKIP_TENANT_CHECK_KEY, true);
