import type { VercelRequest, VercelResponse } from '@vercel/node';
import { setCorsHeaders } from './_lib/cors';

// Auth handlers
import authRegister from './_auth/register';
import authLogin from './_auth/login';
import authMe from './_auth/me';
import authChangePassword from './_auth/change-password';

// Memo handlers
import memosList from './_memos/index';
import memosById from './_memos/[id]';
import memosSubmit from './_memos/[id]/submit';
import memosExportPdf from './_memos/[id]/export-pdf';

// Workflow handlers
import workflowApprove from './_workflow/[memoId]/approve';
import workflowReject from './_workflow/[memoId]/reject';
import workflowRequestChanges from './_workflow/[memoId]/request-changes';
import workflowForward from './_workflow/[memoId]/forward';

// Comments handlers
import commentsIndex from './_comments/index';
import commentsGet from './_comments/[memoId]';

// Attachments handlers
import attachmentsUpload from './_attachments/[memoId]';
import attachmentsDownload from './_attachments/download/[id]';

// Notifications handlers
import notificationsList from './_notifications/index';
import notificationsRead from './_notifications/[id]/read';

// Admin handlers
import adminOrganization from './_admin/organization';
import adminUsers from './_admin/users';
import adminDepartments from './_admin/departments';
import adminCategories from './_admin/categories';
import adminDashboard from './_admin/dashboard';

// Search handler
import searchIndex from './_search/index';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Apply CORS for all routes
  setCorsHeaders(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  const raw = req.query.path;
  const segments: string[] = Array.isArray(raw) ? raw : raw ? [raw] : [];
  const [seg0, seg1, seg2] = segments;

  // ── Auth ──────────────────────────────────────────────────────────────────
  if (seg0 === 'auth') {
    if (seg1 === 'register') return authRegister(req, res);
    if (seg1 === 'login') return authLogin(req, res);
    if (seg1 === 'me') return authMe(req, res);
    if (seg1 === 'change-password') return authChangePassword(req, res);
  }

  // ── Memos ─────────────────────────────────────────────────────────────────
  if (seg0 === 'memos') {
    if (!seg1) return memosList(req, res);
    // Inject dynamic param for handlers that expect req.query.id
    req.query.id = seg1;
    if (!seg2) return memosById(req, res);
    if (seg2 === 'submit') return memosSubmit(req, res);
    if (seg2 === 'export-pdf') return memosExportPdf(req, res);
  }

  // ── Workflow ──────────────────────────────────────────────────────────────
  if (seg0 === 'workflow') {
    req.query.memoId = seg1;
    if (seg2 === 'approve') return workflowApprove(req, res);
    if (seg2 === 'reject') return workflowReject(req, res);
    if (seg2 === 'request-changes') return workflowRequestChanges(req, res);
    if (seg2 === 'forward') return workflowForward(req, res);
  }

  // ── Comments ──────────────────────────────────────────────────────────────
  if (seg0 === 'comments') {
    if (!seg1) return commentsIndex(req, res);
    req.query.memoId = seg1;
    return commentsGet(req, res);
  }

  // ── Attachments ───────────────────────────────────────────────────────────
  if (seg0 === 'attachments') {
    if (seg1 === 'download') {
      req.query.id = seg2;
      return attachmentsDownload(req, res);
    }
    req.query.memoId = seg1;
    return attachmentsUpload(req, res);
  }

  // ── Notifications ─────────────────────────────────────────────────────────
  if (seg0 === 'notifications') {
    if (!seg1) return notificationsList(req, res);
    req.query.id = seg1;
    if (seg2 === 'read') return notificationsRead(req, res);
  }

  // ── Admin ─────────────────────────────────────────────────────────────────
  if (seg0 === 'admin') {
    if (seg1 === 'organization') return adminOrganization(req, res);
    if (seg1 === 'users') return adminUsers(req, res);
    if (seg1 === 'departments') return adminDepartments(req, res);
    if (seg1 === 'categories') return adminCategories(req, res);
    if (seg1 === 'dashboard') return adminDashboard(req, res);
  }

  // ── Search ────────────────────────────────────────────────────────────────
  if (seg0 === 'search') return searchIndex(req, res);

  return res.status(404).json({ error: 'Not found' });
}
