import { Controller, Post, Body } from '@nestjs/common';
import { PaymentsService } from './payments.service';

@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  // Create Razorpay Order
  @Post('create-order')
  async createOrder(@Body() body: { amount: number }) {
    return this.paymentsService.createOrder(body.amount);
  }

  // Verify Payment
  @Post('verify')
  verify(@Body() body: any) {
    const isValid = this.paymentsService.verifyPayment(body);

    if (!isValid) {
      return { success: false };
    }

    return { success: true };
  }
}
