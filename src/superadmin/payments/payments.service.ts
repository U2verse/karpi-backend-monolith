import { Injectable } from '@nestjs/common';
import Razorpay from 'razorpay';
import * as crypto from 'crypto';

@Injectable()
export class PaymentsService {
  private razorpay: Razorpay;

  constructor() {
    if (
      process.env.ENABLE_PAYMENTS === 'true' &&
      process.env.RAZORPAY_KEY_ID &&
      process.env.RAZORPAY_KEY_SECRET
    ) {
      this.razorpay = new Razorpay({
        key_id: process.env.RAZORPAY_KEY_ID,
        key_secret: process.env.RAZORPAY_KEY_SECRET,
      });
    } else {
      console.warn('⚠️ Razorpay disabled or keys missing');
    }
  }

  // 1️⃣ Create Order
  async createOrder(amount: number) {
    const order = await this.razorpay.orders.create({
      amount: amount * 100, // INR → paise
      currency: 'INR',
      receipt: `receipt_${Date.now()}`,
    });

    return order;
  }

  // 2️⃣ Verify Payment
  verifyPayment(payload: {
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
  }) {
    const body =
      payload.razorpay_order_id + '|' + payload.razorpay_payment_id;

    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!)
      .update(body)
      .digest('hex');

    return expectedSignature === payload.razorpay_signature;
  }
}
