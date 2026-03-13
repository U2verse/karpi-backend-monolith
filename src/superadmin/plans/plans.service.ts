import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Plan } from '../../shared/entities/plan.entity';
import { PlanLimits } from '../../shared/entities/plan-limits.entity';
import { PlanFeatures } from '../../shared/entities/plan-features.entity';
import { ClientPlanSubscription } from '../../shared/entities/client-plan-subscription.entity';
import { toUIValue, toDBValue } from './utils/plan-mapper';
import { CreatePlanDto } from './dto/create-plan.dto';
import { UpdatePlanDto } from './dto/update-plan.dto';

@Injectable()
export class PlansService {
  constructor(
    @InjectRepository(Plan)
    private readonly planRepo: Repository<Plan>,

    @InjectRepository(PlanLimits)
    private readonly limitsRepo: Repository<PlanLimits>,

    @InjectRepository(PlanFeatures)
    private readonly featuresRepo: Repository<PlanFeatures>,

    @InjectRepository(ClientPlanSubscription)
    private readonly subscriptionRepo: Repository<ClientPlanSubscription>,
  ) {}

  // -----------------------------
  // CREATE PLAN
  // -----------------------------
  async create(dto: CreatePlanDto) {
    const plan = this.planRepo.create({
      name: dto.name,
      feature_type: dto.feature_type ?? null,
      meaning: dto.meaning ?? null,
      price_monthly: toDBValue(dto.price_monthly) ?? 0,
      price_yearly: toDBValue(dto.price_yearly),
      save_percentage: dto.save_percentage ?? null,
      best_pick: dto.best_pick ?? false,
      notes: dto.notes ?? null,
    });

    const savedPlan = await this.planRepo.save(plan);

    const limits = this.limitsRepo.create({
      plan_id: savedPlan.id,
      storage_mb: toDBValue(dto.limits.storage_mb),
      student_limit: toDBValue(dto.limits.student_limit),
      course_limit: toDBValue(dto.limits.course_limit),
      video_limit: toDBValue(dto.limits.video_limit),
      assignment_limit: toDBValue(dto.limits.assignment_limit),
      materials_per_course: toDBValue(dto.limits.materials_per_course),
      admin_logins: toDBValue(dto.limits.admin_logins),
    });

    const features = this.featuresRepo.create({
      plan_id: savedPlan.id,
      student_app_access: dto.features.student_app_access ?? true,
      certificates: dto.features.certificates ?? null,
      custom_domain: dto.features.custom_domain ?? false,
      subdomain: dto.features.subdomain ?? true,
      analytics: dto.features.analytics ?? null,
      branding: dto.features.branding ?? null,
      support_level: dto.features.support_level ?? null,
    });

    await Promise.all([
      this.limitsRepo.save(limits),
      this.featuresRepo.save(features),
    ]);

    return this.findOne(savedPlan.id);
  }

  // -----------------------------
  // GET ALL PLANS
  // -----------------------------
  async findAll() {
    const plans = await this.planRepo.find({
      relations: { limits: true, features: true },
    });

    return Promise.all(plans.map((p) => this.formatPlan(p)));
  }

  // -----------------------------
  // GET SINGLE PLAN
  // -----------------------------
  async findOne(id: number) {
    const p = await this.planRepo.findOne({
      where: { id },
      relations: { limits: true, features: true },
    });
    if (!p) throw new NotFoundException('Plan not found');

    return this.formatPlan(p);
  }

  // -----------------------------
  // UPDATE PLAN
  // -----------------------------
  async update(id: number, dto: UpdatePlanDto) {
    const plan = await this.planRepo.findOne({
      where: { id },
      relations: { limits: true, features: true },
    });
    if (!plan) throw new NotFoundException('Plan not found');

    // Update plan pricing/metadata
    if (dto.name !== undefined) plan.name = dto.name;
    if (dto.feature_type !== undefined) plan.feature_type = dto.feature_type;
    if (dto.meaning !== undefined) plan.meaning = dto.meaning;
    if (dto.price_monthly !== undefined) plan.price_monthly = toDBValue(dto.price_monthly) ?? 0;
    if (dto.price_yearly !== undefined) plan.price_yearly = toDBValue(dto.price_yearly);
    if (dto.save_percentage !== undefined) plan.save_percentage = dto.save_percentage;
    if (dto.best_pick !== undefined) plan.best_pick = dto.best_pick;
    if (dto.notes !== undefined) plan.notes = dto.notes;
    await this.planRepo.save(plan);

    // Update limits
    if (dto.limits) {
      const limits = plan.limits ?? this.limitsRepo.create({ plan_id: id });
      if (dto.limits.storage_mb !== undefined) limits.storage_mb = toDBValue(dto.limits.storage_mb);
      if (dto.limits.student_limit !== undefined) limits.student_limit = toDBValue(dto.limits.student_limit);
      if (dto.limits.course_limit !== undefined) limits.course_limit = toDBValue(dto.limits.course_limit);
      if (dto.limits.video_limit !== undefined) limits.video_limit = toDBValue(dto.limits.video_limit);
      if (dto.limits.assignment_limit !== undefined) limits.assignment_limit = toDBValue(dto.limits.assignment_limit);
      if (dto.limits.materials_per_course !== undefined) limits.materials_per_course = toDBValue(dto.limits.materials_per_course);
      if (dto.limits.admin_logins !== undefined) limits.admin_logins = toDBValue(dto.limits.admin_logins);
      await this.limitsRepo.save(limits);
    }

    // Update features
    if (dto.features) {
      const features = plan.features ?? this.featuresRepo.create({ plan_id: id });
      if (dto.features.student_app_access !== undefined) features.student_app_access = dto.features.student_app_access;
      if (dto.features.certificates !== undefined) features.certificates = dto.features.certificates;
      if (dto.features.custom_domain !== undefined) features.custom_domain = dto.features.custom_domain;
      if (dto.features.subdomain !== undefined) features.subdomain = dto.features.subdomain;
      if (dto.features.analytics !== undefined) features.analytics = dto.features.analytics;
      if (dto.features.branding !== undefined) features.branding = dto.features.branding;
      if (dto.features.support_level !== undefined) features.support_level = dto.features.support_level;
      await this.featuresRepo.save(features);
    }

    return this.findOne(id);
  }

  // -----------------------------
  // DELETE PLAN
  // -----------------------------
  async remove(id: number) {
    const plan = await this.planRepo.findOne({ where: { id } });
    if (!plan) throw new NotFoundException('Plan not found');

    const subscriptionCount = await this.subscriptionRepo.count({
      where: { plan_id: id },
    });
    if (subscriptionCount > 0) {
      throw new BadRequestException(
        'Cannot delete this plan because it is currently assigned to clients.',
      );
    }

    await this.planRepo.delete(id);
    return { message: 'Plan deleted successfully' };
  }

  // -----------------------------
  // CHECK PLAN LIMIT (used by feature gates)
  // -----------------------------
  async getLimits(planId: number): Promise<PlanLimits> {
    const limits = await this.limitsRepo.findOne({ where: { plan_id: planId } });
    if (!limits) throw new NotFoundException('Plan limits not found');
    return limits;
  }

  // -----------------------------
  // PRIVATE: Format response
  // -----------------------------
  private async formatPlan(p: Plan) {
    const clientCount = await this.subscriptionRepo.count({
      where: { plan_id: p.id },
    });

    return {
      id: p.id,
      name: p.name,
      feature_type: p.feature_type,
      meaning: p.meaning,
      price_monthly: p.price_monthly,
      price_yearly: p.price_yearly,
      save_percentage: p.save_percentage,
      best_pick: p.best_pick,
      notes: p.notes,
      created_at: p.created_at,
      clientCount,
      limits: p.limits
        ? {
            storage_mb: toUIValue(p.limits.storage_mb),
            student_limit: toUIValue(p.limits.student_limit),
            course_limit: toUIValue(p.limits.course_limit),
            video_limit: toUIValue(p.limits.video_limit),
            assignment_limit: toUIValue(p.limits.assignment_limit),
            materials_per_course: toUIValue(p.limits.materials_per_course),
            admin_logins: toUIValue(p.limits.admin_logins),
          }
        : null,
      features: p.features
        ? {
            student_app_access: p.features.student_app_access,
            certificates: p.features.certificates,
            custom_domain: p.features.custom_domain,
            subdomain: p.features.subdomain,
            analytics: p.features.analytics,
            branding: p.features.branding,
            support_level: p.features.support_level,
          }
        : null,
    };
  }
}
