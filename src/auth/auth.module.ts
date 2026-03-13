import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';

import { User } from '../shared/entities/user.entity';
import { RefreshToken } from '../shared/entities/refresh-token.entity';
import { UserAuthAudit } from '../shared/entities/user-auth-audit.entity';
import { Student } from '../shared/entities/student.entity';
import { JwtStrategy } from './jwt.strategy';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      RefreshToken,
      UserAuthAudit,
      Student,
    ]),

    // FIXED: async + correct typing
    JwtModule.registerAsync({
      useFactory: (): any => ({
        secret: process.env.JWT_SECRET,
        signOptions: {
          expiresIn: (process.env.JWT_EXPIRES || '7d') as any,
          algorithm: 'HS256', // 🔴 THIS IS THE KEY LINE
        },
      }),
    }),
  ],

  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
})
export class AuthModule {}
