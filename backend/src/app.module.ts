import { Module } from '@nestjs/common';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from './database/database.module';
import { AuthModule } from './modules/auth/auth.module';
import { GatewaysModule } from './gateways/gateways.module';
import { TenantsModule } from './modules/tenants/tenants.module';
import { StationsModule } from './modules/stations/stations.module';
import { OrdersModule } from './modules/orders/orders.module';
import { KitchenStatusModule } from './modules/kitchen-status/kitchen-status.module';
import { TempoModule } from './modules/tempo/tempo.module';
import { CustomerTrackerModule } from './modules/customer-tracker/customer-tracker.module';
import { DeliveryModule } from './modules/delivery/delivery.module';
import { JwtAuthGuard } from './common/guards/auth.guard';
import { TenantGuard } from './common/guards/tenant.guard';
import { RolesGuard } from './common/guards/roles.guard';
import { TierGuard } from './common/guards/tier.guard';
import { TenantScopeInterceptor } from './common/interceptors/tenant-scope.interceptor';
import { TenantContextService } from './common/services/tenant-context.service';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    DatabaseModule,
    AuthModule,
    GatewaysModule,
    TenantsModule,
    StationsModule,
    OrdersModule,
    KitchenStatusModule,
    TempoModule,
    CustomerTrackerModule,
    DeliveryModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    TenantContextService,
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: TenantGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
    {
      provide: APP_GUARD,
      useClass: TierGuard,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: TenantScopeInterceptor,
    },
    {
      provide: APP_FILTER,
      useClass: HttpExceptionFilter,
    },
  ],
  exports: [TenantContextService],
})
export class AppModule {}
