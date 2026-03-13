export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-') // replace spaces & symbols with -
    .replace(/^-+|-+$/g, ''); // trim - from start/end
}
