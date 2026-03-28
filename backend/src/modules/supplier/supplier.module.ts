import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { SupplierController } from './supplier.controller';
import { SupplierService } from './supplier.service';
import { SupplierRepository } from './supplier.repository';
import { AutoReorderService } from './auto-reorder.service';
import { DatabaseModule } from '../../database/database.module';
import { GatewaysModule } from '../../gateways/gateways.module';

@Module({
  imports: [
    DatabaseModule,
    GatewaysModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET') ?? 'jwt-secret-dev',
        signOptions: { expiresIn: '15m' },
      }),
    }),
  ],
  controllers: [SupplierController],
  providers: [SupplierService, SupplierRepository, AutoReorderService],
  exports: [SupplierService, SupplierRepository, AutoReorderService],
})
export class SupplierModule {}
