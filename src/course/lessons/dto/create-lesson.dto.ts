export class CreateLessonDto {
  tenant_id: string;
  module_id: string;
  course_id: string;
  title: string;
  type?: string;         // video | text | quiz | assignment
  video_url?: string;
  content?: string;
  order_index?: number;
}
