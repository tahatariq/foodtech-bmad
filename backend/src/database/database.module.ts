import { Global, Module } from '@nestjs/common';
import { DatabaseProvider, DRIZZLE } from './database.provider';

@Global()
@Module({
  providers: [DatabaseProvider],
  exports: [DRIZZLE],
})
export class DatabaseModule {}
