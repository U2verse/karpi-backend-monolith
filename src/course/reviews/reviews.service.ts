import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CourseReview } from './course-review.entity';
import { CreateReviewDto } from './dto/create-review.dto';

@Injectable()
export class ReviewsService {
  constructor(
    @InjectRepository(CourseReview)
    private readonly repo: Repository<CourseReview>,
  ) {}

  create(dto: CreateReviewDto) {
    const review = this.repo.create(dto);
    return this.repo.save(review);
  }

  findByCourse(courseId: string) {
    return this.repo.find({ where: { course_id: courseId } });
  }
}
