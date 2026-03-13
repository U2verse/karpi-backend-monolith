import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { typeOrmConfig } from './shared/database/typeorm.config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { TenantContextMiddleware } from './shared/database/tenant-context.middleware';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { ClientModule } from './client/client.module';
import { SuperadminModule } from './superadmin/superadmin.module';
import { StudentModule } from './student/student.module';
import { CourseModule } from './course/course.module';
import { AssignmentModule } from './assignment/assignment.module';
import { NotificationModule } from './notification/notification.module';
import { VideoModule } from './video/video.module';
import { DocumentModule } from './document/document.module';
import { InviteModule } from './invite/invite.module';


@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRoot(typeOrmConfig),
    ScheduleModule.forRoot(),
    AuthModule,
    ClientModule,
    SuperadminModule,
    StudentModule,
    CourseModule,
    AssignmentModule,
    NotificationModule,
    VideoModule,
    DocumentModule,
    InviteModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(TenantContextMiddleware).forRoutes('*');
  }
}
