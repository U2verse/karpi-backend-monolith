export class DomainResponseDto {
  domain_id: number;
  client_id: number;
  domain: string;
  type: string;
  verified: boolean;
  status: string;
  created_at: Date;
  updated_at: Date;
}
