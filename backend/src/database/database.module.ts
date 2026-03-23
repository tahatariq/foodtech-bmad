import { Global, Inject, Module, OnModuleDestroy } from '@nestjs/common';
import { Pool } from 'pg';
import {
  DatabaseProvider,
  DB_POOL,
  DRIZZLE,
  PoolProvider,
} from './database.provider';

@Global()
@Module({
  providers: [PoolProvider, DatabaseProvider],
  exports: [DRIZZLE],
})
export class DatabaseModule implements OnModuleDestroy {
  constructor(@Inject(DB_POOL) private readonly pool: Pool) {}

  async onModuleDestroy() {
    await this.pool.end();
  }
}
