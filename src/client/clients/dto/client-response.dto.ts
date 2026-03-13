export class ClientResponseDto {
  client_id: number;
  name: string;
  subdomain: string;
  custom_domain?: string;
  domain_type: string;
  plan?: string;
  logo_url?: string;
  theme_color?: string;
  status: string;
  created_at: Date;
  updated_at: Date;
}
