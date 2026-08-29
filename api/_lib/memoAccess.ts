import type { AuthContext } from './auth';

/** Memo lookup filter — platform admins may access any org's memo by id. */
export function memoWhereById(memoId: string, ctx: AuthContext) {
  if (ctx.isPlatformAdmin) return { id: memoId };
  return { id: memoId, organizationId: ctx.organizationId };
}
