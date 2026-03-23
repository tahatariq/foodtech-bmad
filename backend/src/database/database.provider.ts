import { Provider } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { drizzle, NodePgDatabase } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema';

export const DRIZZLE = 'DRIZZLE';

export type DrizzleDB = NodePgDatabase<typeof schema>;

export const DatabaseProvider: Provider = {
  provide: DRIZZLE,
  inject: [ConfigService],
  useFactory: (configService: ConfigService): DrizzleDB => {
    const connectionString =
      configService.get<string>('DATABASE_URL') ??
      'postgresql://foodtech:foodtech@localhost:5432/foodtech';

    const pool = new Pool({ connectionString });
    return drizzle(pool, { schema });
  },
};
