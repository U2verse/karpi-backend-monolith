import { Injectable } from '@nestjs/common';
import { ClientBrandingService } from '../client-branding/client-branding.service';
import { ClientProfileService } from '../client-profile/client-profile.service';
import { ClientUsageService } from '../client-usage/client-usage.service';
import { ClientSettingsService } from '../client-settings/client-settings.service';
import { ClientLandingPageService } from '../client_landing_page/client-landing-page.service';

@Injectable()
export class ClientInitializerService {
  constructor(
    private brandingService: ClientBrandingService,
    private profileService: ClientProfileService,
    private usageService: ClientUsageService,
    private settingsService: ClientSettingsService,
    private landingPageService: ClientLandingPageService,
  ) {}

  async initialize(client_id: number) {
    // 1️⃣ Default Branding
    await this.brandingService.createOrUpdate(client_id, {
      theme_mode: 'light',
      theme_color: 'blue',
      primary_color: '#3b82f6',
      secondary_color: '#1e40af',
      font_family: 'Inter',
    });

    // 2️⃣ Default Profile
    await this.profileService.createOrUpdate(client_id, {
      academy_name: 'New Academy',
      owner_name: 'Owner',
      contact_email: 'contact@example.com',
      phone: '0000000000',
      address: '',
      about: '',
      services: [],
    });

    // 3️⃣ Default Usage (limits = 0 until Super Admin sets plan)
    await this.usageService.createOrUpdate(client_id, {
      total_storage_used_mb: 0,
      storage_limit_mb: 0,
      students_used: 0,
      students_limit: 0,
      courses_used: 0,
      courses_limit: 0,
      videos_used: 0,
      videos_limit: 0,
      assignments_used: 0,
      assignments_limit: 0,
    });

    // 4️⃣ Default Settings
    await this.settingsService.createOrUpdate(client_id, {
      enable_chat: true,
      enable_notifications: true,
      enable_payment: true,
      enable_landing_page: true,
      certificate_auto_generate: false,
      language: 'en',
      timezone: 'Asia/Kolkata',
    });

    // 5️⃣ Default Landing Page
    await this.landingPageService.createOrUpdate(client_id, {
      headline: 'Welcome to Our Academy',
      subtitle: 'Learn. Grow. Achieve.',
      about_section: '',
      testimonials: [],
      achievements: [],
      courses_preview: [],
    });
  }
}
