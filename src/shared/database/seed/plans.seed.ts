import { DataSource } from 'typeorm';
import { AppDataSource } from '../data-source';

const PLANS = [
  {
    name: 'Sprout',
    feature_type: 'Free Trial',
    meaning: 'Start growing',
    price_monthly: 0,
    price_yearly: 0,
    save_percentage: null,
    best_pick: false,
    limits: {
      storage_mb: 5120,       // 5 GB
      student_limit: 50,
      course_limit: 2,
      video_limit: 10,
      assignment_limit: 3,
      materials_per_course: 5,
      admin_logins: 1,
    },
    features: {
      student_app_access: true,
      certificates: null,
      custom_domain: false,
      subdomain: true,
      analytics: 'basic',
      branding: 'basic',
      support_level: 'basic',
    },
  },
  {
    name: 'Bloom',
    feature_type: 'Starter',
    meaning: 'Expand & organise',
    price_monthly: 499,
    price_yearly: 4999,
    save_percentage: '17%',
    best_pick: false,
    limits: {
      storage_mb: 25600,      // 25 GB
      student_limit: 500,
      course_limit: 25,
      video_limit: 25,
      assignment_limit: 10,
      materials_per_course: 20,
      admin_logins: 3,
    },
    features: {
      student_app_access: true,
      certificates: 'Yes',
      custom_domain: true,
      subdomain: true,
      analytics: 'advanced',
      branding: 'advanced_themes',
      support_level: 'business_hours',
    },
  },
  {
    name: 'Thrive',
    feature_type: 'Mid-Tier',
    meaning: 'Grow strong',
    price_monthly: 1299,
    price_yearly: 12999,
    save_percentage: '17%',
    best_pick: true,
    limits: {
      storage_mb: 102400,     // 100 GB
      student_limit: 2000,
      course_limit: 100,
      video_limit: 50,
      assignment_limit: 20,
      materials_per_course: 50,
      admin_logins: 10,
    },
    features: {
      student_app_access: true,
      certificates: 'Yes',
      custom_domain: true,
      subdomain: true,
      analytics: 'advanced',
      branding: 'advanced_themes',
      support_level: 'business_hours',
    },
  },
  {
    name: 'Evolve',
    feature_type: 'Maxi Use',
    meaning: 'Fully scale',
    price_monthly: 2999,
    price_yearly: 29999,
    save_percentage: '17%',
    best_pick: false,
    limits: {
      storage_mb: 307200,     // 300 GB
      student_limit: null,    // Unlimited
      course_limit: null,     // Unlimited
      video_limit: 100,
      assignment_limit: null, // Unlimited
      materials_per_course: null, // Unlimited
      admin_logins: null,     // Unlimited
    },
    features: {
      student_app_access: true,
      certificates: 'Yes (Advanced)',
      custom_domain: true,
      subdomain: true,
      analytics: 'white_label',
      branding: 'white_label',
      support_level: 'priority',
    },
  },
];

async function seed(dataSource: DataSource) {
  // Set RLS context
  await dataSource.query(`SELECT set_config('my.role', 'SUPERADMIN', false)`);
  await dataSource.query(`SELECT set_config('my.tenant_id', '', false)`);

  for (const plan of PLANS) {
    // Skip if plan name already exists
    const existing = await dataSource.query(
      `SELECT id FROM plans WHERE name = $1 LIMIT 1`,
      [plan.name],
    );

    if (existing.length > 0) {
      console.log(`✔ Plan already exists: ${plan.name}`);
      continue;
    }

    // Insert plan
    const [inserted] = await dataSource.query(
      `INSERT INTO plans (name, feature_type, meaning, price_monthly, price_yearly, save_percentage, best_pick)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id`,
      [
        plan.name,
        plan.feature_type,
        plan.meaning,
        plan.price_monthly,
        plan.price_yearly,
        plan.save_percentage,
        plan.best_pick,
      ],
    );
    const planId = inserted.id;

    // Insert limits
    const l = plan.limits;
    await dataSource.query(
      `INSERT INTO plan_limits (plan_id, storage_mb, student_limit, course_limit, video_limit, assignment_limit, materials_per_course, admin_logins)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [planId, l.storage_mb, l.student_limit, l.course_limit, l.video_limit, l.assignment_limit, l.materials_per_course, l.admin_logins],
    );

    // Insert features
    const f = plan.features;
    await dataSource.query(
      `INSERT INTO plan_features (plan_id, student_app_access, certificates, custom_domain, subdomain, analytics, branding, support_level)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [planId, f.student_app_access, f.certificates, f.custom_domain, f.subdomain, f.analytics, f.branding, f.support_level],
    );

    console.log(`🌱 Seeded plan: ${plan.name} (id=${planId})`);
  }
}

async function bootstrap() {
  await AppDataSource.initialize();
  try {
    await seed(AppDataSource);
    console.log('\n✅ Plans seed complete.');
  } catch (err) {
    console.error('❌ Seed failed:', err);
    process.exit(1);
  } finally {
    await AppDataSource.destroy();
    process.exit(0);
  }
}

bootstrap();
