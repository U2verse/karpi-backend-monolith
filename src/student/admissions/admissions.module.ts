
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdmissionLink } from '../../shared/entities/admission-link.entity';
import { AdmissionsService } from './admissions.service';
import { AdmissionsController } from './admissions.controller';
import { StudentsModule } from '../students/students.module';
import { EnrollmentsModule } from '../enrollments/enrollments.module';
import { forwardRef, Module } from '@nestjs/common';

@Module({
  imports: [TypeOrmModule.forFeature([AdmissionLink]), 
    forwardRef(() => StudentsModule),     // ✅ FIX
    forwardRef(() => EnrollmentsModule), 
  ],
  controllers: [AdmissionsController],
  providers: [AdmissionsService],
  exports: [AdmissionsService],
})
export class AdmissionsModule {}
