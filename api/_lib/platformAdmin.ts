const PLATFORM_ADMIN_EMAILS = (process.env.PLATFORM_ADMIN_EMAILS || '')
  .split(',')
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean)
  .slice(0, 3);

export function isPlatformAdminEmail(email: string): boolean {
  return PLATFORM_ADMIN_EMAILS.includes(email.toLowerCase());
}

export function getPlatformAdminEmails(): string[] {
  return PLATFORM_ADMIN_EMAILS;
}
