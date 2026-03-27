import { Injectable, NotFoundException } from '@nestjs/common';
import { StationsRepository } from './stations.repository';
import type { CreateStationDto } from './dto/create-station.dto';
import type { CreateOrderStagesDto } from './dto/create-order-stages.dto';
import type { UpdateStageThresholdsDto } from './dto/update-stage-thresholds.dto';

@Injectable()
export class StationsService {
  constructor(private readonly repository: StationsRepository) {}

  async createStation(tenantId: string, dto: CreateStationDto) {
    return this.repository.createStation({
      name: dto.name,
      emoji: dto.emoji,
      display_order: dto.displayOrder,
      tenant_id: tenantId,
    });
  }

  async findAllStations(tenantId: string) {
    return this.repository.findStationsByTenant(tenantId);
  }

  async createOrderStages(tenantId: string, dto: CreateOrderStagesDto) {
    await this.repository.deleteOrderStagesByTenant(tenantId);
    const stagesData = dto.stages.map((s) => ({
      name: s.name,
      sequence: s.sequence,
      tenant_id: tenantId,
    }));
    return this.repository.createOrderStages(stagesData);
  }

  async findOrderStages(tenantId: string) {
    return this.repository.findOrderStagesByTenant(tenantId);
  }

  async updateStageThresholds(
    tenantId: string,
    stageId: string,
    dto: UpdateStageThresholdsDto,
  ) {
    const stage = await this.repository.findOrderStageById(stageId, tenantId);
    if (!stage) {
      throw new NotFoundException({
        type: 'https://foodtech.app/errors/not-found',
        title: 'Stage Not Found',
        status: 404,
        detail: `Order stage ${stageId} not found.`,
      });
    }

    return this.repository.updateOrderStageThresholds(stageId, {
      ...(dto.warningThresholdMinutes !== undefined
        ? { warning_threshold_minutes: dto.warningThresholdMinutes }
        : {}),
      ...(dto.criticalThresholdMinutes !== undefined
        ? { critical_threshold_minutes: dto.criticalThresholdMinutes }
        : {}),
    });
  }
}
