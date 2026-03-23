import { Provider } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { drizzle, NodePgDatabase } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema';

export const DRIZZLE = 'DRIZZLE';
export const DB_POOL = 'DB_POOL';

export type DrizzleDB = NodePgDatabase<typeof schema>;

export const PoolProvider: Provider = {
  provide: DB_POOL,
  inject: [ConfigService],
  useFactory: (configService: ConfigService): Pool => {
    const connectionString = configService.get<string>('DATABASE_URL');
    if (!connectionString && process.env.NODE_ENV === 'production') {
      throw new Error(
        'DATABASE_URL environment variable is required in production',
      );
    }
    return new Pool({
      connectionString:
        connectionString ??
        'postgresql://foodtech:foodtech@localhost:5432/foodtech',
    });
  },
};

export const DatabaseProvider: Provider = {
  provide: DRIZZLE,
  inject: [DB_POOL],
  useFactory: (pool: Pool): DrizzleDB => {
    return drizzle(pool, { schema });
  },
};
