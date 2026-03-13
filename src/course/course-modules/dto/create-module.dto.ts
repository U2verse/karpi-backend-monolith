export class CreateModuleDto {
  tenant_id: string;
  course_id: string;
  title: string;
  order_index?: number;
}
