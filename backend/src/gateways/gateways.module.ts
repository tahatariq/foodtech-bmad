import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { EventsGateway } from './events.gateway';
import { EventBusService } from './services/event-bus.service';

@Module({
  imports: [
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET') ?? 'jwt-secret-dev',
      }),
    }),
  ],
  providers: [EventsGateway, EventBusService],
  exports: [EventBusService],
})
export class GatewaysModule {}
