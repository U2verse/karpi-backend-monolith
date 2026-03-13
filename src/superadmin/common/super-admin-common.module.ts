import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { SuperAdminGuard } from './guards/super-admin.guard';

@Module({
  imports: [
    JwtModule.registerAsync({
      useFactory: () => ({
        secret: process.env.JWT_SECRET,
        signOptions: { expiresIn: '1d' },
      }),
    }),
  ],
  providers: [SuperAdminGuard],
  exports: [SuperAdminGuard, JwtModule],
})
export class SuperAdminCommonModule {}
