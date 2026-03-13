// Convert DB numeric (null = unlimited) → UI string
export const toUIValue = (value: number | null | undefined): string | null => {
  if (value === null || value === undefined) return 'Unlimited';
  return value.toString();
};

// Convert UI string/number ("Unlimited" | "50" | 50 | null) → DB numeric (null = unlimited)
export const toDBValue = (value: string | number | null | undefined): number | null => {
  if (value === null || value === undefined || value === '') return null;

  if (typeof value === 'number') return value;

  if (value.toLowerCase() === 'unlimited') return null;

  return Number(value);
};
