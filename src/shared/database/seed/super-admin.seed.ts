import { NestFactory } from '@nestjs/core';
import { AppModule } from '../../../app.module';
import { User, UserRole } from '../../entities/user.entity';
import { DataSource, Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { getRepositoryToken } from '@nestjs/typeorm';

/**
 * 🔒 IMPORTANT
 * tenant_id must be STRING (UUID-style), never number
 */
const SUPER_TENANT_ID = '00000000-0000-0000-0000-000000000000';

const TENANTS = {
  TENANT_1: '11111111-1111-1111-1111-111111111111',
  TENANT_2: '22222222-2222-2222-2222-222222222222',
  TENANT_3: '33333333-3333-3333-3333-333333333333',
};

async function bootstrap() {
  const appContext = await NestFactory.createApplicationContext(AppModule);
  const dataSource = appContext.get(DataSource);
  const userRepo = appContext.get<Repository<User>>(getRepositoryToken(User));

  // Set RLS context so inserts are not blocked by row-level security policies
  await dataSource.query(`SELECT set_config('my.role', 'SUPERADMIN', false)`);
  await dataSource.query(`SELECT set_config('my.tenant_id', '', false)`);

  // ----------------------------------------------------------------------
  // 1️⃣ CREATE SUPER ADMINS (GLOBAL)
  // ----------------------------------------------------------------------
  const superAdmins = [
    { name: 'Super Admin 1', email: 'admin1@karpi.com' },
    { name: 'Super Admin 2', email: 'admin2@karpi.com' },
  ];

  for (const admin of superAdmins) {
    const exists = await userRepo.findOne({ where: { email: admin.email } });

    if (!exists) {
      const password_hash = await bcrypt.hash('admin123', 10);

      const user = userRepo.create({
        name: admin.name,
        email: admin.email,
        password_hash,
        role: UserRole.SUPERADMIN,
        tenant_id: SUPER_TENANT_ID,
        status: 'active',
      });

      await userRepo.save(user);
      console.log(`🚀 Created superadmin: ${admin.email}`);
    } else {
      console.log(`✔ Superadmin exists: ${admin.email}`);
    }
  }

  // ----------------------------------------------------------------------
  // 2️⃣ CREATE CLIENT ADMINS
  // ----------------------------------------------------------------------
  const clientAdmins = [
    { name: 'Admin A', email: 'adminA@client.com', tenant_id: TENANTS.TENANT_1 },
    { name: 'Admin B', email: 'adminB@client.com', tenant_id: TENANTS.TENANT_2 },
    { name: 'Admin C', email: 'adminC@client.com', tenant_id: TENANTS.TENANT_3 },
  ];

  for (const admin of clientAdmins) {
    const exists = await userRepo.findOne({ where: { email: admin.email } });

    if (!exists) {
      const password_hash = await bcrypt.hash('admin123', 10);

      const user = userRepo.create({
        name: admin.name,
        email: admin.email,
        password_hash,
        role: UserRole.CLIENTADMIN,
        tenant_id: admin.tenant_id,
        status: 'active',
      });

      await userRepo.save(user);
      console.log(`👑 Created client admin: ${admin.email}`);
    } else {
      console.log(`✔ Client admin exists: ${admin.email}`);
    }
  }

  // ----------------------------------------------------------------------
  // 3️⃣ CREATE STUDENTS
  // ----------------------------------------------------------------------
  const students = [
    { name: 'Student A1', email: 'studentA1@client.com', tenant_id: TENANTS.TENANT_1 },
    { name: 'Student A2', email: 'studentA2@client.com', tenant_id: TENANTS.TENANT_1 },

    { name: 'Student B1', email: 'studentB1@client.com', tenant_id: TENANTS.TENANT_2 },
    { name: 'Student B2', email: 'studentB2@client.com', tenant_id: TENANTS.TENANT_2 },

    { name: 'Student C1', email: 'studentC1@client.com', tenant_id: TENANTS.TENANT_3 },
    { name: 'Student C2', email: 'studentC2@client.com', tenant_id: TENANTS.TENANT_3 },
  ];

  for (const student of students) {
    const exists = await userRepo.findOne({ where: { email: student.email } });

    if (!exists) {
      const password_hash = await bcrypt.hash('admin123', 10);

      const user = userRepo.create({
        name: student.name,
        email: student.email,
        password_hash,
        role: UserRole.STUDENT,
        tenant_id: student.tenant_id,
        status: 'active',
      });

      await userRepo.save(user);
      console.log(`🎓 Created student: ${student.email}`);
    } else {
      console.log(`✔ Student exists: ${student.email}`);
    }
  }

  await appContext.close();
  process.exit(0);
}

bootstrap();
