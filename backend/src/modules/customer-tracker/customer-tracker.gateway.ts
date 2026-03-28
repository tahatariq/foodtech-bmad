import {
  WebSocketGateway,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Socket } from 'socket.io';
import { CustomerTrackerService } from './customer-tracker.service';

@WebSocketGateway({
  namespace: '/customer-tracking',
  cors: { origin: '*' },
  transports: ['websocket', 'polling'],
})
export class CustomerTrackerGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  private readonly logger = new Logger(CustomerTrackerGateway.name);

  constructor(private readonly trackerService: CustomerTrackerService) {}

  async handleConnection(client: Socket) {
    const token = client.handshake.query['token'] as string | undefined;

    if (!token) {
      this.logger.warn('Customer tracker connection rejected: no token');
      client.disconnect();
      return;
    }

    try {
      const result = await this.trackerService.findOrderByToken(token);

      if (!result || ('expired' in result && result.expired)) {
        this.logger.warn(
          'Customer tracker connection rejected: invalid or expired token',
        );
        client.disconnect();
        return;
      }

      if ('orderId' in result) {
        const room = `customer:${result.orderId}`;
        void client.join(room);
        client.data = { orderId: result.orderId, token };
        this.logger.log(`Customer connected to tracking room ${room}`);
      }
    } catch (error) {
      this.logger.error('Error validating customer tracking token', error);
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    const data = client.data as { orderId?: string } | undefined;
    if (data?.orderId) {
      this.logger.log(
        `Customer disconnected from tracking room customer:${data.orderId}`,
      );
    }
  }

  @SubscribeMessage('sync')
  async handleSync(@ConnectedSocket() client: Socket) {
    const data = client.data as { token?: string } | undefined;
    if (!data?.token) return;

    try {
      const result = await this.trackerService.findOrderByToken(data.token);
      if (result && !('expired' in result && result.expired)) {
        client.emit('order.state', result);
      }
    } catch (error) {
      this.logger.error('Error during sync', error);
    }
  }
}
