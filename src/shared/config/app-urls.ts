const DEFAULT_BACKEND_BASE_URL = `http://localhost:${process.env.PORT ?? '4100'}`;
const DEFAULT_FRONTEND_BASE_URL = 'http://localhost:3002';
const DEFAULT_STUDENT_APP_BASE_URL = 'http://localhost:3003';

function stripTrailingSlash(url: string): string {
  return url.replace(/\/+$/, '');
}

export const BACKEND_BASE_URL = stripTrailingSlash(
  process.env.BACKEND_BASE_URL ??
    process.env.API_GATEWAY_INTERNAL_URL ??
    process.env.SUPERADMIN_PUBLIC_URL ??
    DEFAULT_BACKEND_BASE_URL,
);

export const INTERNAL_AUTH_BASE_URL = `${BACKEND_BASE_URL}/auth`;
export const INVOICES_BASE_URL = `${BACKEND_BASE_URL}/invoices`;
export const FRONTEND_BASE_URL = stripTrailingSlash(
  process.env.FRONTEND_BASE_URL ??
    process.env.FRONTEND_URL ??
    DEFAULT_FRONTEND_BASE_URL,
);
export const STUDENT_APP_BASE_URL = stripTrailingSlash(
  process.env.STUDENT_APP_BASE_URL ??
    process.env.STUDENT_APP_URL ??
    DEFAULT_STUDENT_APP_BASE_URL,
);
export const ENROLLMENT_FORM_URL = stripTrailingSlash(
  process.env.ENROLLMENT_FORM_URL ?? `${FRONTEND_BASE_URL}/enroll`,
);
export const INFRA_WEBHOOK_URL = process.env.INFRA_WEBHOOK_URL?.trim() || undefined;
