const DEFAULT_BACKEND_BASE_URL = `http://localhost:${process.env.PORT ?? '4100'}`;
const DEFAULT_FRONTEND_BASE_URL = 'http://localhost:3002';
const DEFAULT_STUDENT_APP_BASE_URL = 'http://localhost:3003';

function stripTrailingSlash(url: string): string {
  return url.replace(/\/+$/, '');
}

export const KARPI_BACKEND_PUBLIC_URL = stripTrailingSlash(
  process.env.KARPI_BACKEND_PUBLIC_URL ?? DEFAULT_BACKEND_BASE_URL,
);

export const INTERNAL_AUTH_BASE_URL = `${KARPI_BACKEND_PUBLIC_URL}/auth`;
export const INVOICES_BASE_URL = `${KARPI_BACKEND_PUBLIC_URL}/invoices`;
export const CLIENT_ADMIN_BASE_URL = stripTrailingSlash(
  process.env.CLIENT_ADMIN_BASE_URL ?? DEFAULT_FRONTEND_BASE_URL,
);
export const STUDENT_APP_BASE_URL = stripTrailingSlash(
  process.env.STUDENT_APP_BASE_URL ?? DEFAULT_STUDENT_APP_BASE_URL,
);
export const ENROLLMENT_FORM_URL = stripTrailingSlash(
  process.env.ENROLLMENT_FORM_URL ?? `${CLIENT_ADMIN_BASE_URL}/enroll`,
);
export const INFRA_WEBHOOK_URL = process.env.INFRA_WEBHOOK_URL?.trim() || undefined;
