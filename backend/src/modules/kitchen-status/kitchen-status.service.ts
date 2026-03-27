import { Injectable } from '@nestjs/common';
import { KitchenStatusRepository } from './kitchen-status.repository';
import { EventBusService } from '../../gateways/services/event-bus.service';
import { INVENTORY_EVENTS, KITCHEN_EVENTS } from '@foodtech/shared-types';
import type { CreateInventoryItemDto } from './dto/create-inventory-item.dto';
import type { UpdateInventoryDto } from './dto/update-inventory.dto';

export type StationStatus = 'green' | 'yellow' | 'red';

const STATUS_COLORS: Record<StationStatus, string> = {
  green: '#10B981',
  yellow: '#F59E0B',
  red: '#EF4444',
};

const STATUS_TEXT: Record<StationStatus, string> = {
  green: 'Flowing',
  yellow: 'Watch',
  red: 'Backed up',
};

@Injectable()
export class KitchenStatusService {
  constructor(
    private readonly repository: KitchenStatusRepository,
    private readonly eventBus: EventBusService,
  ) {}

  async createItem(tenantId: string, dto: CreateInventoryItemDto) {
    return this.repository.createItem(tenantId, {
      item_name: dto.itemName,
      current_quantity: dto.currentQuantity,
      reorder_threshold: dto.reorderThreshold,
    });
  }

  async findAll(tenantId: string) {
    return this.repository.findAllByTenant(tenantId);
  }

  async findById(tenantId: string, itemId: string) {
    return this.repository.findById(tenantId, itemId);
  }

  async updateItem(tenantId: string, itemId: string, dto: UpdateInventoryDto) {
    if (dto.currentQuantity !== undefined) {
      const updated = await this.repository.updateQuantity(
        tenantId,
        itemId,
        dto.currentQuantity,
      );
      if (updated) {
        this.emitInventoryEvents(tenantId, updated);
      }
      return updated;
    }
    return this.repository.findById(tenantId, itemId);
  }

  async decrementItem(tenantId: string, itemId: string, amount: number) {
    const updated = await this.repository.decrementQuantity(
      tenantId,
      itemId,
      amount,
    );
    if (updated) {
      this.emitInventoryEvents(tenantId, updated);
    }
    return updated;
  }

  async decrementByOrderItems(
    tenantId: string,
    items: { itemName: string; quantity: number }[],
  ) {
    const names = items.map((i) => i.itemName);
    const inventoryRecords = await this.repository.findByNames(tenantId, names);
    const nameToInventory = new Map(
      inventoryRecords.map((r) => [r.item_name, r]),
    );

    const results = [];
    for (const item of items) {
      const inv = nameToInventory.get(item.itemName);
      if (!inv) continue;
      const updated = await this.repository.decrementQuantity(
        tenantId,
        inv.id,
        item.quantity,
      );
      if (updated) {
        this.emitInventoryEvents(tenantId, updated);
        results.push(updated);
      }
    }
    return results;
  }

  async find86dItems(tenantId: string) {
    return this.repository.find86dItems(tenantId);
  }

  // Checklist methods

  async createChecklist(
    tenantId: string,
    dto: { stationId: string; name: string; items?: { description: string }[] },
  ) {
    const checklist = await this.repository.createChecklist(tenantId, {
      station_id: dto.stationId,
      name: dto.name,
    });
    if (dto.items) {
      for (const item of dto.items) {
        await this.repository.addChecklistItem(checklist.id, item.description);
      }
    }
    const items = await this.repository.findChecklistItems(checklist.id);
    return { ...checklist, items };
  }

  async getChecklistByStation(tenantId: string, stationId: string) {
    const checklist = await this.repository.findChecklistByStation(
      tenantId,
      stationId,
    );
    if (!checklist) return null;
    const items = await this.repository.findChecklistItems(checklist.id);
    return { ...checklist, items };
  }

  async addChecklistItem(checklistId: string, description: string) {
    return this.repository.addChecklistItem(checklistId, description);
  }

  async toggleChecklistItem(
    tenantId: string,
    checklistId: string,
    itemId: string,
    isCompleted: boolean,
    userId?: string,
  ) {
    const updated = await this.repository.toggleChecklistItem(
      itemId,
      isCompleted,
      userId,
    );
    if (!updated) return null;

    const allItems = await this.repository.findChecklistItems(checklistId);
    const allComplete = allItems.every((i) => i.is_completed);

    if (allComplete) {
      this.eventBus.emit({
        event: KITCHEN_EVENTS.STATUS_CHANGED,
        payload: {
          checklistId,
          status: 'ready',
          completedAt: new Date().toISOString(),
        },
        tenantId,
        timestamp: new Date().toISOString(),
        eventId: crypto.randomUUID(),
      });
    }

    return { item: updated, allComplete };
  }

  async deleteChecklistItem(itemId: string) {
    await this.repository.deleteChecklistItem(itemId);
  }

  // Station status methods

  calculateStatus(
    ticketCount: number,
    maxTicketAgeMs: number,
    warningThresholdMs = 5 * 60 * 1000,
    criticalThresholdMs = 8 * 60 * 1000,
  ): StationStatus {
    if (ticketCount >= 7 || maxTicketAgeMs >= criticalThresholdMs) return 'red';
    if (
      ticketCount >= 4 ||
      (ticketCount > 0 && maxTicketAgeMs >= warningThresholdMs)
    )
      return 'yellow';
    return 'green';
  }

  async getStationStatus(tenantId: string, stationId: string) {
    const ticketCount = await this.repository.getActiveTicketCountByStation(
      tenantId,
      stationId,
    );
    const oldestTicket = await this.repository.getOldestTicketAge(
      tenantId,
      stationId,
    );
    const maxTicketAgeMs = oldestTicket
      ? Date.now() - oldestTicket.getTime()
      : 0;
    const status = this.calculateStatus(ticketCount, maxTicketAgeMs);

    const checklist = await this.getChecklistByStation(tenantId, stationId);
    const checklistCompletion = checklist?.items?.length
      ? Math.round(
          (checklist.items.filter((i) => i.is_completed).length /
            checklist.items.length) *
            100,
        )
      : 100;

    return {
      stationId,
      status,
      statusColor: STATUS_COLORS[status],
      statusText: STATUS_TEXT[status],
      ticketCount,
      maxTicketAgeMs,
      checklistCompletion,
    };
  }

  async getAllStationStatuses(tenantId: string) {
    const allStations =
      await this.repository.getAllStationsWithStatus(tenantId);
    const statuses = await Promise.all(
      allStations.map(async (station) => {
        const status = await this.getStationStatus(tenantId, station.id);
        return {
          ...status,
          stationName: station.name,
          stationEmoji: station.emoji,
        };
      }),
    );
    return statuses;
  }

  private emitInventoryEvents(
    tenantId: string,
    item: {
      id: string;
      item_name: string;
      current_quantity: number;
      reorder_threshold: number;
      is_86d: boolean;
    },
  ) {
    this.eventBus.emit({
      event: INVENTORY_EVENTS.LEVEL_CHANGED,
      payload: {
        itemId: item.id,
        itemName: item.item_name,
        newQuantity: item.current_quantity,
        is86d: item.is_86d,
      },
      tenantId,
      timestamp: new Date().toISOString(),
      eventId: crypto.randomUUID(),
    });

    if (item.is_86d) {
      this.eventBus.emit({
        event: INVENTORY_EVENTS.EIGHTY_SIXED,
        payload: { itemId: item.id, itemName: item.item_name },
        tenantId,
        timestamp: new Date().toISOString(),
        eventId: crypto.randomUUID(),
      });
    }

    if (
      item.current_quantity > 0 &&
      item.current_quantity <= item.reorder_threshold
    ) {
      this.eventBus.emit({
        event: 'inventory.reorder.triggered',
        payload: {
          itemId: item.id,
          itemName: item.item_name,
          currentQuantity: item.current_quantity,
          reorderThreshold: item.reorder_threshold,
        },
        tenantId,
        timestamp: new Date().toISOString(),
        eventId: crypto.randomUUID(),
      });
    }
  }
}
