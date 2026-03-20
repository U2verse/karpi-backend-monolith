import { Body, Controller, Post } from "@nestjs/common";
import { EnrollmentInvitesService } from "./enrollment_invites.service";
import { CreateEnrollmentInviteDto } from "./dto/create-enrollment-invite.dto";
import { SubmitEnrollmentDto } from "./dto/submit-enrollment.dto";
import { IsString, IsNotEmpty, IsNumber, IsIn } from "class-validator";

class CreateOrderDto {
  @IsString() @IsNotEmpty() token: string;
  @IsNumber() plan_id: number;
  @IsString() @IsIn(['monthly', 'yearly']) billing_type: 'monthly' | 'yearly';
}

@Controller("enrollments")
export class EnrollmentInvitesController {
  constructor(private readonly inviteService: EnrollmentInvitesService) {}

  @Post("invite")
  createInvite(@Body() dto: CreateEnrollmentInviteDto) {
    return this.inviteService.createInvite(dto);
  }

  @Post("create-order")
  createOrder(@Body() dto: CreateOrderDto) {
    return this.inviteService.createRazorpayOrder(dto.token, dto.plan_id, dto.billing_type);
  }

  @Post("submit")
  submitEnrollment(@Body() dto: SubmitEnrollmentDto) {
    return this.inviteService.submitEnrollment(dto);
  }
}
