import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Server, Socket } from 'socket.io';
import { createWsAuthMiddleware } from './middleware/ws-auth.middleware';
import { EventBusService } from './services/event-bus.service';
import { EXPEDITOR_ROOM, DELIVERY_ROOM } from '@foodtech/shared-types';

interface WsUser {
  userId: string;
  tenantId: string;
  role: string;
  email: string;
}

@WebSocketGateway({
  cors: { origin: '*' },
  transports: ['websocket', 'polling'],
  pingInterval: 25000,
  pingTimeout: 20000,
})
export class EventsGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server!: Server;

  private readonly logger = new Logger(EventsGateway.name);

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly eventBusService: EventBusService,
  ) {}

  afterInit(server: Server) {
    const jwtSecret =
      this.configService.get<string>('JWT_SECRET') ?? 'jwt-secret-dev';
    server.use(createWsAuthMiddleware(this.jwtService, jwtSecret));
    this.eventBusService.setServer(server);
    this.logger.log('WebSocket gateway initialized');
  }

  handleConnection(client: Socket) {
    const user = (client.data as { user?: WsUser }).user;
    if (!user) {
      client.disconnect();
      return;
    }

    // Join role-appropriate rooms
    switch (user.role) {
      case 'head_chef':
        void client.join(EXPEDITOR_ROOM);
        break;
      case 'location_manager':
      case 'org_owner':
        void client.join(EXPEDITOR_ROOM);
        break;
      case 'delivery_partner':
        void client.join(DELIVERY_ROOM);
        break;
    }

    this.logger.log(
      `Client connected: ${user.userId} (${user.role}) tenant=${user.tenantId}`,
    );
  }

  handleDisconnect(client: Socket) {
    const user = (client.data as { user?: WsUser }).user;
    if (user) {
      this.logger.log(
        `Client disconnected: ${user.userId} tenant=${user.tenantId}`,
      );
    }
  }

  @SubscribeMessage('request:state-sync')
  handleStateSync(@ConnectedSocket() client: Socket) {
    const user = (client.data as { user?: WsUser }).user;
    if (!user) return;

    // Emit state sync event back to requesting client
    client.emit('system.state.sync', {
      event: 'system.state.sync',
      payload: { status: 'synced' },
      tenantId: user.tenantId,
      timestamp: new Date().toISOString(),
      eventId: crypto.randomUUID(),
    });
  }
}
