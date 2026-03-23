import { Injectable } from '@nestjs/common';
import { Server } from 'socket.io';
import { getTenantNamespace } from '@foodtech/shared-types';

interface FoodTechEvent<T = unknown> {
  event: string;
  payload: T;
  tenantId: string;
  timestamp: string;
  eventId: string;
}

@Injectable()
export class EventBusService {
  private server: Server | null = null;

  setServer(server: Server) {
    this.server = server;
  }

  emit<T>(event: FoodTechEvent<T>): void {
    if (!this.server) return;
    if (!event.tenantId) throw new Error('tenantId is required');

    const enriched = {
      ...event,
      eventId: event.eventId || crypto.randomUUID(),
      timestamp: event.timestamp || new Date().toISOString(),
    };

    const namespace = this.server.of(getTenantNamespace(event.tenantId));
    namespace.emit(enriched.event, enriched);
  }

  emitToRoom<T>(tenantId: string, room: string, event: FoodTechEvent<T>): void {
    if (!this.server) return;

    const enriched = {
      ...event,
      eventId: event.eventId || crypto.randomUUID(),
      timestamp: event.timestamp || new Date().toISOString(),
    };

    const namespace = this.server.of(getTenantNamespace(tenantId));
    namespace.to(room).emit(enriched.event, enriched);
  }

  emitToUser<T>(
    tenantId: string,
    userId: string,
    event: FoodTechEvent<T>,
  ): void {
    if (!this.server) return;

    const enriched = {
      ...event,
      eventId: event.eventId || crypto.randomUUID(),
      timestamp: event.timestamp || new Date().toISOString(),
    };

    const namespace = this.server.of(getTenantNamespace(tenantId));
    const sockets = namespace.sockets;
    for (const [, socket] of sockets) {
      if (
        (socket.data as { user?: { userId: string } }).user?.userId === userId
      ) {
        socket.emit(enriched.event, enriched);
      }
    }
  }
}
