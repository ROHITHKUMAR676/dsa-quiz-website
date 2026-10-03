export const ADMIN_EMAILS = [
  "kaviarasi.m.2024.cse@rajalakshmi.edu.in",
  "intellexa@rajalakshmi.edu.in",
] as const;

export function isAdminEmail(email: string) {
  return ADMIN_EMAILS.includes(email.trim().toLowerCase() as (typeof ADMIN_EMAILS)[number]);
}
