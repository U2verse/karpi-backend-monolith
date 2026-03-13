import { Body, Controller, Post } from "@nestjs/common";
import { EnrollmentInvitesService } from "./enrollment_invites.service";
import { CreateEnrollmentInviteDto } from "./dto/create-enrollment-invite.dto";
import { SubmitEnrollmentDto } from "./dto/submit-enrollment.dto";

@Controller("enrollments")
export class EnrollmentInvitesController {
  constructor(private readonly inviteService: EnrollmentInvitesService) {}

  @Post("invite")
  createInvite(@Body() dto: CreateEnrollmentInviteDto) {
    return this.inviteService.createInvite(dto);
  }

  @Post("submit")
  submitEnrollment(@Body() dto: SubmitEnrollmentDto) {
    return this.inviteService.submitEnrollment(dto);
  }

}
