import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Billing } from '../../shared/entities/billing.entity';
import { ClientPlanSubscription } from '../../shared/entities/client-plan-subscription.entity';
import { GenerateBillingDto } from './dto/generate-billing.dto';
import { RecordPaymentDto } from './dto/record-payment.dto';
import { BadRequestException } from '@nestjs/common';


@Injectable()
export class BillingService {
  constructor(
    @InjectRepository(Billing)
    private readonly billingRepo: Repository<Billing>,
    @InjectRepository(ClientPlanSubscription)
    private readonly subRepo: Repository<ClientPlanSubscription>,
  ) {}

  async generate(dto: GenerateBillingDto) {
    const sub = await this.subRepo.findOne({
      where: { id: dto.subscription_id },
    });
    if (!sub) throw new NotFoundException('Subscription not found');

    const billing = this.billingRepo.create({
      client_id: dto.client_id,
      subscription_id: dto.subscription_id,
      amount: dto.amount,
      status: 'pending',
    });

    return this.billingRepo.save(billing);
  }

  async recordPayment(dto: RecordPaymentDto) {
    const bill = await this.billingRepo.findOne({
      where: { id: dto.billing_id },
      relations: ['subscription'],
    });

    if (!bill) throw new NotFoundException('Billing entry not found');

    // ❗ Check if the subscription is active
    if (!bill.subscription.active) {
      throw new BadRequestException(
        `Cannot record payment: Subscription ${bill.subscription_id} is not active`,
      );
    }

    if (!bill) throw new NotFoundException('Billing entry not found');

    bill.status = dto.status;
    bill.transaction_id = dto.transaction_id ?? bill.transaction_id;
    bill.invoice_url = dto.invoice_url ?? bill.invoice_url;
    bill.paid_on = dto.status === 'paid' ? new Date() : bill.paid_on;

    return this.billingRepo.save(bill);
  }

  findByClient(clientId: number) {
    return this.billingRepo.find({
      where: { client_id: clientId },
      order: { created_at: 'DESC' },
    });
  }
}
