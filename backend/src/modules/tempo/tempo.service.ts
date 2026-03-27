import { Injectable } from '@nestjs/common';
import { EventBusService } from '../../gateways/services/event-bus.service';
import { TempoRepository } from './tempo.repository';

export type TempoStatus = 'green' | 'amber' | 'red';

export interface StationTempo {
  stationId: string;
  stationName: string;
  avgTime: number;
  ticketCount: number;
  status: TempoStatus;
  isBottleneck: boolean;
}

const DEFAULT_TARGET = 5;

@Injectable()
export class TempoService {
  constructor(
    private readonly repository: TempoRepository,
    private readonly eventBus: EventBusService,
  ) {}

  getTempoStatus(
    tempoValue: number,
    target: number = DEFAULT_TARGET,
  ): TempoStatus {
    if (tempoValue <= 0 || tempoValue < target) return 'green';
    if (tempoValue <= 2 * target) return 'amber';
    return 'red';
  }

  async calculateTempo(tenantId: string, target: number = DEFAULT_TARGET) {
    const activeItems = await this.repository.getActiveOrderItems(tenantId);

    if (activeItems.length === 0) {
      return {
        tempoValue: 0,
        status: 'green' as TempoStatus,
        stationBreakdown: [],
        target,
        calculatedAt: new Date().toISOString(),
      };
    }

    const now = Date.now();
    const byStation = new Map<
      string,
      { stationName: string; times: number[] }
    >();

    for (const item of activeItems) {
      const elapsedMs = now - new Date(item.stage_entered_at).getTime();
      const elapsedMin = elapsedMs / 60000;

      if (!byStation.has(item.station_id)) {
        byStation.set(item.station_id, {
          stationName: item.station_name ?? item.station_id,
          times: [],
        });
      }
      byStation.get(item.station_id)!.times.push(elapsedMin);
    }

    const stationBreakdown: StationTempo[] = [];
    let totalTime = 0;
    let totalCount = 0;

    for (const [stationId, data] of byStation) {
      const avg = data.times.reduce((sum, t) => sum + t, 0) / data.times.length;
      stationBreakdown.push({
        stationId,
        stationName: data.stationName,
        avgTime: Math.round(avg * 10) / 10,
        ticketCount: data.times.length,
        status: this.getTempoStatus(avg, target),
        isBottleneck: false,
      });
      totalTime += data.times.reduce((sum, t) => sum + t, 0);
      totalCount += data.times.length;
    }

    const tempoValue =
      totalCount > 0 ? Math.round((totalTime / totalCount) * 10) / 10 : 0;
    const status = this.getTempoStatus(tempoValue, target);

    // Bottleneck detection: flag stations with 2x the average of others
    const bottleneckStationIds: string[] = [];
    if (stationBreakdown.length >= 2) {
      for (const station of stationBreakdown) {
        const others = stationBreakdown.filter(
          (s) => s.stationId !== station.stationId,
        );
        const othersAvg =
          others.reduce((sum, s) => sum + s.avgTime, 0) / others.length;
        if (othersAvg > 0 && station.avgTime >= 2 * othersAvg) {
          station.isBottleneck = true;
          bottleneckStationIds.push(station.stationId);
        }
      }
    }

    return {
      tempoValue,
      status,
      stationBreakdown,
      bottleneckStationIds,
      target,
      calculatedAt: new Date().toISOString(),
    };
  }

  async recalculateAndEmit(tenantId: string) {
    const result = await this.calculateTempo(tenantId);
    this.eventBus.emit({
      event: 'tempo.updated',
      payload: result,
      tenantId,
      timestamp: new Date().toISOString(),
      eventId: crypto.randomUUID(),
    });
    return result;
  }
}
