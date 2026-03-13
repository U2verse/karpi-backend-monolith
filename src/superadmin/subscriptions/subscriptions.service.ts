import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThanOrEqual } from 'typeorm';
import { ClientPlanSubscription } from '../../shared/entities/client-plan-subscription.entity';
import { Plan } from '../../shared/entities/plan.entity';
import { AssignPlanDto } from './dto/assign-plan.dto';
import { UpgradePlanDto } from './dto/upgrade-plan.dto';
import { CancelSubscriptionDto } from './dto/cancel-subscription.dto';
import { addMonths, addYears } from 'date-fns';


@Injectable()
export class SubscriptionsService {
  constructor(
    @InjectRepository(ClientPlanSubscription)
    private readonly subRepo: Repository<ClientPlanSubscription>,
    @InjectRepository(Plan)
    private readonly planRepo: Repository<Plan>,
  ) {}

  async assignPlan(dto: AssignPlanDto) {
    const plan = await this.planRepo.findOne({ where: { id: dto.plan_id } });
    if (!plan) throw new NotFoundException('Plan not found');

    const start = dto.start_date ? new Date(dto.start_date) : new Date();
    const end =
      dto.renew_type === 'monthly'
        ? addMonths(start, 1)
        : addYears(start, 1);

    const sub = this.subRepo.create({
      client_id: dto.client_id,
      plan_id: dto.plan_id,
      start_date: start.toISOString().slice(0, 10),
      end_date: end.toISOString().slice(0, 10),
      renew_type: dto.renew_type,
      active: true,
    });

    return this.subRepo.save(sub);
  }

  async upgradePlan(dto: UpgradePlanDto) {
    const sub = await this.subRepo.findOne({
      where: { id: dto.current_subscription_id },
    });
    if (!sub) throw new NotFoundException('Subscription not found');

    const newPlan = await this.planRepo.findOne({
      where: { id: dto.new_plan_id },
    });
    if (!newPlan) throw new NotFoundException('New plan not found');

    const oldId = sub.id;

    // deactivate old
    sub.active = false;
    await this.subRepo.save(sub);

    // create new subscription
    const start = new Date();
    const end =
      dto.renew_type === 'monthly'
        ? addMonths(start, 1)
        : addYears(start, 1);

    const newSub = this.subRepo.create({
      client_id: sub.client_id,
      plan_id: newPlan.id,
      start_date: start.toISOString().slice(0, 10),
      end_date: end.toISOString().slice(0, 10),
      renew_type: dto.renew_type,
      active: true,
      upgraded_from: oldId,
    });

    return this.subRepo.save(newSub);
  }

  async cancel(dto: CancelSubscriptionDto) {
    const sub = await this.subRepo.findOne({
      where: { id: dto.subscription_id },
    });
    if (!sub) throw new NotFoundException('Subscription not found');
    sub.active = false;
    return this.subRepo.save(sub);
  }

  findActiveByClient(clientId: number) {
    return this.subRepo.find({
      where: {
        client_id: clientId,
        active: true,
        end_date: MoreThanOrEqual(new Date()), // <-- now Date, matches entity
      },
      relations: ['plan'],
    });
  }

  findByClient(clientId: number) {
    return this.subRepo.find({
      where: { client_id: clientId },
      relations: ['plan'],
    });
  }
}
