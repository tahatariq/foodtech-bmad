import { Inject, Injectable, BadRequestException } from '@nestjs/common';
import { eq, and } from 'drizzle-orm';
import { DRIZZLE, type DrizzleDB } from '../../database/database.provider';
import { orders } from '../../database/schema/orders.schema';
import { orderItems } from '../../database/schema/orders.schema';
import { stations } from '../../database/schema/stations.schema';

type SimulatorPace = 'rush' | 'steady' | 'slow';

interface SimulatorState {
  interval: ReturnType<typeof setInterval>;
  ordersGenerated: number;
  pace: SimulatorPace;
}

const PACE_INTERVALS: Record<SimulatorPace, number> = {
  rush: 20_000,
  steady: 60_000,
  slow: 180_000,
};

const SAMPLE_ITEMS = [
  'Margherita Pizza',
  'Caesar Salad',
  'Grilled Salmon',
  'Cheeseburger',
  'Pad Thai',
  'Fish Tacos',
  'Risotto',
  'Club Sandwich',
];

@Injectable()
export class SimulatorService {
  private readonly simulations = new Map<string, SimulatorState>();

  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDB) {}

  async start(tenantId: string, pace: SimulatorPace, orderCount?: number) {
    if (this.simulations.has(tenantId)) {
      throw new BadRequestException({
        type: 'https://foodtech.app/errors/conflict',
        title: 'Simulator Already Running',
        status: 400,
        detail: 'Simulator is already running for this tenant.',
      });
    }

    const tenantStations = await this.db
      .select()
      .from(stations)
      .where(eq(stations.tenant_id, tenantId));

    if (tenantStations.length === 0) {
      throw new BadRequestException({
        type: 'https://foodtech.app/errors/validation',
        title: 'No Stations',
        status: 400,
        detail: 'Tenant has no stations configured. Activate tenant first.',
      });
    }

    const state: SimulatorState = {
      interval: null as unknown as ReturnType<typeof setInterval>,
      ordersGenerated: 0,
      pace,
    };

    const generate = async () => {
      if (orderCount && state.ordersGenerated >= orderCount) {
        this.stop(tenantId);
        return;
      }

      try {
        const station =
          tenantStations[Math.floor(Math.random() * tenantStations.length)];
        const itemName =
          SAMPLE_ITEMS[Math.floor(Math.random() * SAMPLE_ITEMS.length)];
        const orderNumber = `SIM-${Date.now().toString(36).toUpperCase()}`;

        const [order] = await this.db
          .insert(orders)
          .values({
            order_number: orderNumber,
            status: 'received',
            is_simulated: true,
            tenant_id: tenantId,
          })
          .returning();

        await this.db.insert(orderItems).values({
          order_id: order.id,
          item_name: itemName,
          station_id: station.id,
          stage: 'received',
          quantity: Math.floor(Math.random() * 3) + 1,
          tenant_id: tenantId,
        });

        state.ordersGenerated++;
      } catch {
        // Silently continue on errors during simulation
      }
    };

    // Generate first order immediately
    await generate();

    state.interval = setInterval(() => void generate(), PACE_INTERVALS[pace]);

    this.simulations.set(tenantId, state);

    return {
      running: true,
      pace,
      intervalMs: PACE_INTERVALS[pace],
    };
  }

  stop(tenantId: string) {
    const state = this.simulations.get(tenantId);
    if (state) {
      clearInterval(state.interval);
      this.simulations.delete(tenantId);
    }
    return { running: false, ordersGenerated: state?.ordersGenerated ?? 0 };
  }

  getStatus(tenantId: string) {
    const state = this.simulations.get(tenantId);
    return {
      running: !!state,
      ordersGenerated: state?.ordersGenerated ?? 0,
      pace: state?.pace ?? null,
    };
  }

  async clearSimulatedData(tenantId: string) {
    // First get simulated orders for this tenant
    const simulatedOrders = await this.db
      .select({ id: orders.id })
      .from(orders)
      .where(
        and(eq(orders.tenant_id, tenantId), eq(orders.is_simulated, true)),
      );

    if (simulatedOrders.length === 0) {
      return { deleted: 0 };
    }

    const orderIds = simulatedOrders.map((o) => o.id);

    // Delete order items first (FK constraint)
    for (const orderId of orderIds) {
      await this.db.delete(orderItems).where(eq(orderItems.order_id, orderId));
    }

    // Delete orders
    let deleted = 0;
    for (const orderId of orderIds) {
      await this.db.delete(orders).where(eq(orders.id, orderId));
      deleted++;
    }

    return { deleted };
  }
}
