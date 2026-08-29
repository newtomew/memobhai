import type { VercelRequest, VercelResponse } from '@vercel/node';
import { setCorsHeaders } from './_lib/cors';

function parsePath(req: VercelRequest): string[] {
  const raw = req.query.path;
  if (Array.isArray(raw)) {
    return raw.flatMap((part) => part.split('/')).filter(Boolean);
  }
  if (typeof raw === 'string' && raw.length > 0) {
    return raw.split('/').filter(Boolean);
  }
  const url = req.url || '';
  const match = url.match(/\/api\/([^?]*)/);
  if (match?.[1]) {
    return match[1].split('/').filter(Boolean);
  }
  return [];
}

type Handler = (req: VercelRequest, res: VercelResponse) => unknown;

async function run(mod: string, req: VercelRequest, res: VercelResponse) {
  const { default: handler } = await import(mod) as { default: Handler };
  return handler(req, res);
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCorsHeaders(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  const segments = parsePath(req);
  const [seg0, seg1, seg2, seg3] = segments;

  if (seg0 === 'auth') {
    if (seg1 === 'register') return run('./_auth/register', req, res);
    if (seg1 === 'login') return run('./_auth/login', req, res);
    if (seg1 === 'me') return run('./_auth/me', req, res);
    if (seg1 === 'change-password') return run('./_auth/change-password', req, res);
    if (seg1 === 'org-lookup') return run('./_auth/org-lookup', req, res);
  }

  if (seg0 === 'memos') {
    if (!seg1) return run('./_memos/index', req, res);
    req.query.id = seg1;
    if (!seg2) return run('./_memos/[id]', req, res);
    if (seg2 === 'submit') return run('./_memos/[id]/submit', req, res);
    if (seg2 === 'cancel') return run('./_memos/[id]/cancel', req, res);
    if (seg2 === 'export-pdf') return run('./_memos/[id]/export-pdf', req, res);
    if (seg2 === 'versions') return run('./_memos/[id]/versions', req, res);
  }

  if (seg0 === 'workflow') {
    req.query.memoId = seg1;
    if (seg2 === 'approve') return run('./_workflow/[memoId]/approve', req, res);
    if (seg2 === 'reject') return run('./_workflow/[memoId]/reject', req, res);
    if (seg2 === 'request-changes') return run('./_workflow/[memoId]/request-changes', req, res);
    if (seg2 === 'forward') return run('./_workflow/[memoId]/forward', req, res);
  }

  if (seg0 === 'comments') {
    if (!seg1) return run('./_comments/index', req, res);
    req.query.memoId = seg1;
    return run('./_comments/[memoId]', req, res);
  }

  if (seg0 === 'attachments') {
    if (seg1 === 'download') {
      req.query.id = seg2;
      return run('./_attachments/download/[id]', req, res);
    }
    req.query.memoId = seg1;
    return run('./_attachments/[memoId]', req, res);
  }

  if (seg0 === 'notifications') {
    if (!seg1) return run('./_notifications/index', req, res);
    req.query.id = seg1;
    if (seg2 === 'read') return run('./_notifications/[id]/read', req, res);
  }

  if (seg0 === 'admin') {
    if (seg1 === 'organization') return run('./_admin/organization', req, res);
    if (seg1 === 'users') return run('./_admin/users', req, res);
    if (seg1 === 'departments') return run('./_admin/departments', req, res);
    if (seg1 === 'categories') return run('./_admin/categories', req, res);
    if (seg1 === 'dashboard') return run('./_admin/dashboard', req, res);
    if (seg1 === 'audit-logs') return run('./_admin/audit-logs', req, res);
    if (seg1 === 'templates') return run('./_admin/templates', req, res);
    if (seg1 === 'email') return run('./_admin/email', req, res);
  }

  if (seg0 === 'search') return run('./_search/index', req, res);

  if (seg0 === 'dashboard' && seg1 === 'summary') return run('./_dashboard/summary', req, res);

  if (seg0 === 'messages') return run('./_messages/index', req, res);

  if (seg0 === 'join-requests') return run('./_join-requests/index', req, res);

  if (seg0 === 'profile') return run('./_profile/index', req, res);

  if (seg0 === 'delegations') return run('./_delegations/index', req, res);

  if (seg0 === 'billing') return run('./_billing/index', req, res);

  if (seg0 === 'platform') {
    if (seg1 === 'organizations') return run('./_platform/organizations', req, res);
    if (seg1 === 'ban') return run('./_platform/ban', req, res);
  }

  return res.status(404).json({ error: 'Not found', path: segments });
}
