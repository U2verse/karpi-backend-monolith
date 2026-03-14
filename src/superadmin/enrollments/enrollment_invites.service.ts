import { Injectable, BadRequestException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { EnrollmentInvite } from "./enrollment_invite.entity";
import { CreateEnrollmentInviteDto } from "./dto/create-enrollment-invite.dto";
import { randomBytes } from "crypto";
import { SubmitEnrollmentDto } from "./dto/submit-enrollment.dto";
import { DataSource } from "typeorm";
import axios from "axios";
import * as bcrypt from 'bcrypt';
import { getEmailTransporter } from "./email";
import * as fs from "fs";
import * as path from "path";
import { generateInvoicePDF } from "../utils/generate-invoice";
import { sendInvoiceEmail } from "../utils/send-invoice-email";
import { WhatsappService } from '../whatsapp/whatsapp.service';
import { ClientsService } from '../../client/clients/clients.service';
import { ClientUsageService } from '../../client/client-usage/client-usage.service';
import { ClientProfileService } from '../../client/client-profile/client-profile.service';
import { ClientSettingsService } from '../../client/client-settings/client-settings.service';
import { ClientBrandingService } from '../../client/client-branding/client-branding.service';
import { ClientLandingPageService } from '../../client/client_landing_page/client-landing-page.service';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';
import {
  ENROLLMENT_FORM_URL,
  INTERNAL_AUTH_BASE_URL,
  INVOICES_BASE_URL,
} from '../../shared/config/app-urls';


@Injectable()
export class EnrollmentInvitesService {
  constructor(
    @InjectRepository(EnrollmentInvite)
    private inviteRepo: Repository<EnrollmentInvite>,
    private dataSource: DataSource,
    private whatsappService: WhatsappService,
    private clientsService: ClientsService,
    private clientUsageService: ClientUsageService,
    private clientProfileService: ClientProfileService,
    private clientSettingsService: ClientSettingsService,
    private clientBrandingService: ClientBrandingService,
    private clientLandingPageService: ClientLandingPageService,
    private subscriptionsService: SubscriptionsService,
  ) {}

  // -------------------------------------------------
  // CREATE INVITE + SEND EMAIL / WHATSAPP
  // -------------------------------------------------
  async createInvite(dto: CreateEnrollmentInviteDto) {
    const { clientName, email, whatsapp, planId } = dto;

    if (!clientName || !email) {
      throw new BadRequestException(
        "Client name and email are required to send enrollment form",
      );
    }

    // Block if this email already completed an enrollment (has an active academy)
    const existingEnrolled = await this.dataSource.query(
      `SELECT u.user_id FROM users u
       WHERE u.email = $1 AND u.tenant_id IS NOT NULL
       LIMIT 1`,
      [email]
    );
    if (existingEnrolled.length > 0) {
      throw new BadRequestException(
        `This email is already registered with an active academy. Each email can only own one academy.`
      );
    }

    // Invalidate any previously pending (incomplete) invites for this email
    await this.dataSource.query(
      `UPDATE enrollment_invites SET completed = true WHERE email = $1 AND completed = false`,
      [email]
    );

    const token = randomBytes(32).toString("hex");

    const inviteData: Partial<EnrollmentInvite> = {
      client_name: clientName,
      email,
      whatsapp: whatsapp ?? undefined,  // <-- FIXED
      plan_id: planId ?? undefined,     // <-- FIXED
      token,
    };

    const invite = this.inviteRepo.create(inviteData);
    await this.inviteRepo.save(invite);
    
    const link = `${ENROLLMENT_FORM_URL}?token=${token}`;

    await this.sendEmail(email, clientName, link);

    if (whatsapp) {
      try {
      await this.whatsappService.sendEnrollmentMessage(
          whatsapp,
          clientName,
          token,
        );
      } catch (e: any) {
        console.error("⚠️ WhatsApp send failed (non-critical):", e?.message);
      }
    }

    return {
      success: true,
      message: "Enrollment form sent successfully",
      link,
    };
  }

  // -----------------------------------------------------
  // SUBMIT ENROLLMENT (FINAL STEP)
  // -----------------------------------------------------
  async submitEnrollment(dto: SubmitEnrollmentDto) {
    const {
      token,
      plan_id,
      billing_type,
      academy_name,
      owner_name,
      contact_email,
      phone,
      subdomain,
      billing_name,
      address_line1,
      address_line2,
      city,
      state,
      pincode,
      gst_number,
      pan_number,
    } = dto;

    // -----------------------------------------------------
    // 1️⃣ Validate invite token
    // -----------------------------------------------------
    const invite = await this.inviteRepo.findOne({ where: { token } });

    if (!invite) throw new BadRequestException("Invalid or expired token");
    if (invite.completed)
      throw new BadRequestException("This enrollment is already completed. Request a new invite if you want to enroll again.");

    // Block if this email is already associated with an active academy
    const alreadyEnrolled = await this.dataSource.query(
      `SELECT u.user_id, c.subdomain FROM users u
       JOIN clients c ON c.tenant_id = u.tenant_id
       WHERE u.email = $1 AND u.tenant_id IS NOT NULL
       LIMIT 1`,
      [contact_email]
    );
    if (alreadyEnrolled.length > 0) {
      throw new BadRequestException(
        `This email already has an active academy (${alreadyEnrolled[0].subdomain}.karpiapp.com). Each email can only own one academy.`
      );
    }

    const AUTH_API = INTERNAL_AUTH_BASE_URL;

    // -----------------------------------------------------
    // 2️⃣ Fetch Plan Details
    // -----------------------------------------------------
    
    const plan = await this.dataSource.query(
      `
      SELECT
        p.name,
        p.price_monthly,
        p.price_yearly,
        l.storage_mb,
        l.student_limit,
        l.course_limit,
        l.video_limit,
        l.assignment_limit
      FROM plans p
      JOIN plan_limits l ON l.plan_id = p.id
      WHERE p.id = $1
      `,
      [plan_id]
    );

    if (!plan || plan.length === 0) {
      throw new BadRequestException("Invalid plan selected");
    }

    // NULL in plan_limits = Unlimited → use MAX_INT for client_usage (non-nullable INT columns)
    const MAX_INT = 2147483647;
    const storage_limit_mb  = plan[0].storage_mb       ?? MAX_INT;
    const students_limit    = plan[0].student_limit    ?? MAX_INT;
    const courses_limit     = plan[0].course_limit     ?? MAX_INT;
    const videos_limit      = plan[0].video_limit      ?? MAX_INT;
    const assignments_limit = plan[0].assignment_limit ?? MAX_INT;

    // -----------------------------------------------------
    // 3️⃣ Create Auth User
    // -----------------------------------------------------
    type RegisterResponse = { user_id: number };

    let authUserId: number | null = null;
    // Always generate a fresh password so the welcome email can always be sent
    const generatedPassword = Math.random().toString(36).slice(2, 10);
    const passwordHash = await bcrypt.hash(generatedPassword, 10);

    // Check if user already exists (idempotent re-enrollment)
    const existingUser = await this.dataSource.query(
      `SELECT user_id FROM users WHERE email = $1 LIMIT 1`,
      [contact_email]
    );

    if (existingUser.length > 0) {
      authUserId = existingUser[0].user_id;
      // Reset password so the welcome email credentials are always valid
      await this.dataSource.query(
        `UPDATE users SET password_hash = $1 WHERE user_id = $2`,
        [passwordHash, authUserId]
      );
      console.log("ℹ️ Auth user already exists — password reset, user_id:", authUserId);
    } else {
      try {
        const authRes = await axios.post<RegisterResponse>(
          `${AUTH_API}/register`,
          {
            name: owner_name,
            email: contact_email,
            phone,
            role: "clientadmin",
            password: generatedPassword,
            tenant_id: null,
          },
          { headers: { "x-internal-secret": process.env.INTERNAL_ADMIN_TOKEN! } }
        );
        authUserId = authRes.data.user_id;
        console.log("✅ Auth user created authUserId:", authUserId);
      } catch (e: any) {
        console.error("❌ Auth user creation failed:", e?.response?.data || e.message);
        throw new BadRequestException('Enrollment failed: unable to create auth user');
      }
    }

    // -----------------------------------------------------
    // 4️⃣ Create Client (direct service call — no HTTP guard issues)
    // -----------------------------------------------------
    let client_id: number;
    let tenant_id: string;

    // Check if client already exists (idempotent re-enrollment)
    const existingClient = await this.dataSource.query(
      `SELECT client_id, tenant_id FROM clients WHERE subdomain = $1 LIMIT 1`,
      [subdomain]
    );

    if (existingClient.length > 0) {
      client_id = existingClient[0].client_id;
      tenant_id = existingClient[0].tenant_id;
      console.log("ℹ️ Client already exists, reusing client_id:", client_id);
    } else {
      try {
        const clientRes = await this.clientsService.create({
          name: academy_name,
          subdomain,
          domain_type: "subdomain",
          plan: plan_id?.toString(),
        });
        client_id = clientRes.client.client_id;
        tenant_id = clientRes.client.tenant_id;
        console.log("✅ Client created with ID:", client_id, "Tenant ID:", tenant_id);
      } catch (e: any) {
        console.error("❌ Client creation failed:", e?.message || e);
        throw new BadRequestException("Enrollment failed: unable to create client");
      }
    }

    // -----------------------------------------------------
    // 5️⃣ Update user tenant_id
    // -----------------------------------------------------
    try {
      await axios.post(
        `${AUTH_API}/update-user/${authUserId}`,
        { tenant_id },
        { headers: { "x-internal-secret": process.env.INTERNAL_ADMIN_TOKEN! } }
      );
      console.log("✅ User tenant_id updated");
    } catch (e: any) {
      console.error("❌ Failed to update user tenant_id:", e?.response?.data || e.message);
      await this.clientsService.remove(client_id);
      throw new BadRequestException("Enrollment failed: unable to link user to client");
    }

    // -----------------------------------------------------
    // 5️⃣ Initialize Client Usage
    // -----------------------------------------------------
    try {
      await this.clientUsageService.createOrUpdate(client_id, {
        storage_limit_mb,
        students_limit,
        courses_limit,
        videos_limit,
        assignments_limit,
      });
      console.log('✅ Client usage initialized');
    } catch (e: any) {
      console.error('❌ Client usage initialization failed:', e?.message || e);
      await this.clientsService.remove(client_id);
      throw new BadRequestException('Enrollment failed: unable to initialize client usage');
    }

    // -----------------------------------------------------
    // 6️⃣ Client Profile
    // -----------------------------------------------------
    try {
      await this.clientProfileService.createOrUpdate(client_id, {
        academy_name,
        owner_name,
        contact_email,
        phone,
        address: [address_line1, address_line2, city, state, pincode].filter(Boolean).join(", "),
      });
      console.log("✅ Client profile created");
    } catch (e: any) {
      console.error("❌ Client profile creation failed:", e?.message || e);
      await this.clientsService.remove(client_id);
      throw new BadRequestException('Enrollment failed: unable to create client profile');
    }

    // -----------------------------------------------------
    // 6️⃣ Client Settings
    // -----------------------------------------------------
    try {
      await this.clientSettingsService.createOrUpdate(client_id, {
        enable_chat: true,
        enable_notifications: true,
        enable_payment: true,
        enable_landing_page: true,
      });
      console.log("✅ Client settings updated");
    } catch (e: any) {
      console.error("❌ Client settings update failed:", e?.message || e);
      await this.clientsService.remove(client_id);
      throw new BadRequestException('Enrollment failed: unable to update client settings');
    }

    // -----------------------------------------------------
    // 7️⃣ Client Branding
    // -----------------------------------------------------
    try {
      await this.clientBrandingService.createOrUpdate(client_id, {
        theme_color: "#4F46E5",
        primary_color: "#4F46E5",
        secondary_color: "#818CF8",
        theme_mode: "light",
        font_family: "NA",
      });
      console.log("✅ Client branding set");
    } catch (e: any) {
      console.error("❌ Client branding failed:", e?.message || e);
      await this.clientsService.remove(client_id);
      throw new BadRequestException('Enrollment failed: unable to apply client branding');
    }

    // -----------------------------------------------------
    // 8️⃣ Client Landing Page
    // -----------------------------------------------------
    try {
      await this.clientLandingPageService.createOrUpdate(client_id, {
        headline: `${academy_name} — Start Learning Today`,
        subtitle: "Join thousands of learners",
      });
      console.log("✅ Client landing page created");
    } catch (e: any) {
      console.error("❌ Client landing page creation failed:", e?.message || e);
      await this.clientsService.remove(client_id);
      throw new BadRequestException('Enrollment failed: unable to create landing page');
    }

    // -----------------------------------------------------
    // 9️⃣ Assign Subscription / Plan
    // -----------------------------------------------------
    let subscription_id: number;

    try {
      const subscription = await this.subscriptionsService.assignPlan({
        client_id,
        plan_id,
        renew_type: billing_type,
      });
      subscription_id = subscription.id;
      console.log("✅ Subscription assigned with ID:", subscription_id);
    } catch (e: any) {
      console.error("❌ Subscription assignment failed:", e?.message || e);
      await this.clientsService.remove(client_id);
      throw new BadRequestException('Enrollment failed: unable to assign subscription');
    }

    // -----------------------------------------------------
    // 🔟 Save basic enrollment record (NON-CRITICAL)
    // -----------------------------------------------------
    const rawPrice = billing_type === 'yearly'
      ? plan[0].price_yearly
      : plan[0].price_monthly;
    const amount = parseFloat(rawPrice) || 0;

    try {
      await this.dataSource.query(
        `
          INSERT INTO public.enrollments (
            client_id, plan_id, plan_name, billing_type,
            full_name, email, phone, billing_name,
            address_line, city, state, pincode,
            gst_no, pan_no, amount, payment_mode, payment_status
          ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17)
        `,
        [
          client_id,
          plan_id,
          academy_name,
          billing_type,
          owner_name,
          contact_email,
          phone,
          billing_name || owner_name,
          `${address_line1}, ${address_line2 ?? ""}`,
          city,
          state,
          pincode,
          gst_number,
          pan_number,
          amount,
          "mock",
          "success",
        ]
      );

      console.log("✅ Enrollment record saved");

    } catch (e: any) {
      console.error(
        "⚠️ Failed to save enrollment record:",
        e?.message || e
      );

      // ❗ DO NOT ROLLBACK CLIENT / AUTH HERE
      // This is an audit record and can be repaired later
    }

    
    // -----------------------------------------------------
    // 1️⃣6️⃣ Mark Invite Completed (always runs)
    // -----------------------------------------------------
    try {
      invite.completed = true;
      await this.inviteRepo.save(invite);
    } catch (e: any) {
      console.error("⚠️ Failed to mark invite completed:", e?.message || e);
    }

    // -----------------------------------------------------
    // 1️⃣2️⃣–1️⃣5️⃣ Invoice Generation & Email (non-critical)
    // -----------------------------------------------------
    let invoiceNumber: string | undefined;
    let invoiceUrl: string | undefined;

    try {
      invoiceNumber = `INV-${client_id}-${Date.now()}`;

      const pdfPath = await generateInvoicePDF({
        invoiceNumber,
        clientId: client_id,
        academyName: academy_name,
        planName: "Annual Plan",
        amount,
      });

      const invoiceFilename = pdfPath.split("/").pop();
      invoiceUrl = `${INVOICES_BASE_URL}/${invoiceFilename}`;

      await this.dataSource.query(
        `
          INSERT INTO public.client_invoices (
            client_id, subscription_id, billing_id,
            invoice_url, invoice_number,
            issue_date, amount, currency, status
          )
          VALUES ($1,$2,$3,$4,$5,CURRENT_DATE,$6,$7,$8)
        `,
        [client_id, subscription_id, null, invoiceUrl, invoiceNumber, amount, "INR", "paid"]
      );
      console.log("✅ Invoice record created");

      const templatePath = path.resolve(process.cwd(), "src", "superadmin", "email-templates", "invoice-email.html");
      const template = fs.readFileSync(templatePath, "utf8");
      const emailHtml = template
        .replace(/{{NAME}}/g, owner_name)
        .replace(/{{CLIENT_ID}}/g, client_id.toString())
        .replace(/{{ACADEMY}}/g, academy_name)
        .replace(/{{PLAN}}/g, plan[0]?.name ?? 'N/A')
        .replace(/{{INVOICE_ID}}/g, invoiceNumber)
        .replace(/{{AMOUNT}}/g, amount.toString())
        .replace(/{{DATE}}/g, new Date().toLocaleDateString("en-IN"))
        .replace(/{{SUBDOMAIN}}/g, subdomain)
        .replace(/{{YEAR}}/g, new Date().getFullYear().toString());

      await sendInvoiceEmail({ to: contact_email, name: owner_name, html: emailHtml, pdfPath });
      console.log("✅ Invoice email sent");
    } catch (e: any) {
      console.error("⚠️ Invoice/email step failed (non-critical):", e?.message || e);
    }

    // -----------------------------------------------------
    // Welcome Email with Login Credentials (non-critical)
    // -----------------------------------------------------
    try {
      const welcomeTemplatePath = path.resolve(process.cwd(), "src", "superadmin", "email-templates", "welcome-email.html");
      const welcomeTemplate = fs.readFileSync(welcomeTemplatePath, "utf8");
      const academyUrl = `https://${subdomain}.karpiapp.com`;
      const welcomeHtml = welcomeTemplate
        .replace(/{{NAME}}/g, owner_name)
        .replace(/{{EMAIL}}/g, contact_email)
        .replace(/{{PASSWORD}}/g, generatedPassword)
        .replace(/{{ACADEMY_URL}}/g, academyUrl)
        .replace(/{{YEAR}}/g, new Date().getFullYear().toString());

      const transporter = getEmailTransporter();
      await transporter.sendMail({
        from: process.env.FROM_EMAIL,
        to: contact_email,
        subject: "Welcome to Karpi — Your Login Credentials",
        html: welcomeHtml,
      });
      console.log("✅ Welcome email with credentials sent");
    } catch (e: any) {
      console.error("⚠️ Welcome email failed (non-critical):", e?.message || e);
    }

    return {
      success: true,
      message: "Enrollment completed successfully",
      client_id,
      subscription_id,
      subdomain,
      academy_url: `https://${subdomain}.karpiapp.com`,
      invoice_number: invoiceNumber,
      invoice_url: invoiceUrl,
    };
  }

 

  
  // -------------------------------------------------
  // EMAIL SENDER (Stub – Ready for Resend/Nodemailer)
  // -------------------------------------------------
  async sendEmail(email: string, name: string, link: string) {
    try {
      // 1️⃣ Load Template
      const templatePath = path.resolve(
        process.cwd(),
        "src",
        "superadmin",
        "email-templates",
        "enrollment-invite.html"
      );
      const template = fs.readFileSync(templatePath, "utf8");

      const html = template
      .replace(/{{name}}/g, name)
      .replace(/{{link}}/g, link)
      .replace(/{{year}}/g, new Date().getFullYear().toString());
      
      // 2️⃣ Send email using shared transporter
      const transporter = getEmailTransporter();

      const info = await transporter.sendMail({
        from: process.env.FROM_EMAIL,
        to: email,
        subject: "Your Karpi Enrollment Form",
        html,
      });
      console.log("📧 Email Sent:", info.messageId);
      console.log("Using Transporter:", transporter.options);

    } catch (error) {
      console.error("❌ Email Send Error:", error);
     // console.log("Using Transporter:", transporter.options);
    }
  }

  async sendInvoiceEmail(options: {
      email: string;
      name: string;
      clientId: number;
      academyName: string;
      planName: string;
      amount: number;
      subdomain: string;
      invoiceId: string;
      downloadLink: string;
    }) {
      const {
        email,
        name,
        clientId,
        academyName,
        planName,
        amount,
        subdomain,
        invoiceId,
        downloadLink,
      } = options;

      try {
        // 1️⃣ Load invoice template
        const templatePath = path.resolve(
          process.cwd(),
          "src",
          "superadmin",
          "email-templates",
          "invoice-email.html"
        );

        const template = fs.readFileSync(templatePath, "utf8");

        // 2️⃣ Replace placeholders
        const html = template
          .replace(/{{name}}/g, name)
          .replace(/{{CLIENT_ID}}/g, clientId.toString())
          .replace(/{{ACADEMY}}/g, academyName)
          .replace(/{{PLAN}}/g, planName)
          .replace(/{{AMOUNT}}/g, amount.toString())
          .replace(/{{SUBDOMAIN}}/g, subdomain)
          .replace(/{{INVOICE_ID}}/g, invoiceId)
          .replace(/{{INVOICE_DOWNLOAD_LINK}}/g, downloadLink)
          .replace(/{{DATE}}/g, new Date().toLocaleDateString("en-IN"))
          .replace(/{{YEAR}}/g, new Date().getFullYear().toString());

        // 3️⃣ Send invoice email

        const transporter = getEmailTransporter();
        const info = await transporter.sendMail({
          from: process.env.FROM_EMAIL,
          to: email,
          subject: "Your Karpi Invoice",
          html,
        });

        console.log("📧 Invoice Email Sent:", info.messageId);

      } catch (error) {
        console.error("❌ Invoice Email Error:", error);
      }
  }

  // -------------------------------------------------
  // WHATSAPP SENDER (Stub – Ready for WhatsApp Cloud API)
  // -------------------------------------------------
/*   async sendWhatsApp(number: string, link: string) {
    console.log("📱 Sending WhatsApp Message");
    console.log("To:", number);
    console.log("Link:", link);

    // 👉 Replace with:
    // - Meta WhatsApp Cloud API
    // - Twilio WhatsApp
  } */

  async sendWhatsApp(number: string, link: string) {
      try {
        const phone = number.startsWith("91") ? number : `91${number}`;

        const url = `https://graph.facebook.com/v22.0/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`;

        await axios.post(
          url,
          {
            messaging_product: "whatsapp",
            to: phone,
            type: "text",
            text: {
              body: `👋 Welcome to Karpi LMS!

    Your enrollment form is ready.

    📝 Complete your registration here:
    ${link}

    If you need help, reply to this message.

    — Team Karpi 🚀`,
            },
          },
          {
            headers: {
              Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`,
              "Content-Type": "application/json",
            },
          }
        );

        console.log("✅ WhatsApp message sent to", phone);

      } catch (error: any) {
        console.error(
          "❌ WhatsApp send failed:",
          error?.response?.data || error.message
        );
      }
  }

}
