import type { VercelRequest, VercelResponse } from '@vercel/node';
import { setCorsHeaders } from './_lib/cors';

import authRegister from './_auth/register';
import authLogin from './_auth/login';
import authMe from './_auth/me';
import authChangePassword from './_auth/change-password';

import memosList from './_memos/index';
import memosById from './_memos/[id]';
import memosSubmit from './_memos/[id]/submit';
import memosCancel from './_memos/[id]/cancel';
import memosExportPdf from './_memos/[id]/export-pdf';

import workflowApprove from './_workflow/[memoId]/approve';
import workflowReject from './_workflow/[memoId]/reject';
import workflowRequestChanges from './_workflow/[memoId]/request-changes';
import workflowForward from './_workflow/[memoId]/forward';

import commentsIndex from './_comments/index';
import commentsGet from './_comments/[memoId]';

import attachmentsUpload from './_attachments/[memoId]';
import attachmentsDownload from './_attachments/download/[id]';

import notificationsList from './_notifications/index';
import notificationsRead from './_notifications/[id]/read';

import adminOrganization from './_admin/organization';
import adminUsers from './_admin/users';
import adminDepartments from './_admin/departments';
import adminCategories from './_admin/categories';
import adminDashboard from './_admin/dashboard';
import adminAuditLogs from './_admin/audit-logs';
import adminTemplates from './_admin/templates';

import searchIndex from './_search/index';
import dashboardSummary from './_dashboard/summary';

import messagesIndex from './_messages/index';
import joinRequestsIndex from './_join-requests/index';
import profileIndex from './_profile/index';
import platformOrganizations from './_platform/organizations';
import platformBan from './_platform/ban';
import authOrgLookup from './_auth/org-lookup';
import memoVersions from './_memos/[id]/versions';
import delegationsIndex from './_delegations/index';

function parsePath(req: VercelRequest): string[] {
  const raw = req.query.path;
  if (Array.isArray(raw)) {
    return raw.flatMap((part) => part.split('/')).filter(Boolean);
  }
  if (typeof raw === 'string' && raw.length > 0) {
    return raw.split('/').filter(Boolean);
  }
  // Fallback: parse from request URL (/api/auth/login)
  const url = req.url || '';
  const match = url.match(/\/api\/([^?]*)/);
  if (match?.[1]) {
    return match[1].split('/').filter(Boolean);
  }
  return [];
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCorsHeaders(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  const segments = parsePath(req);
  const [seg0, seg1, seg2, seg3] = segments;

  if (seg0 === 'auth') {
    if (seg1 === 'register') return authRegister(req, res);
    if (seg1 === 'login') return authLogin(req, res);
    if (seg1 === 'me') return authMe(req, res);
    if (seg1 === 'change-password') return authChangePassword(req, res);
    if (seg1 === 'org-lookup') return authOrgLookup(req, res);
  }

  if (seg0 === 'memos') {
    if (!seg1) return memosList(req, res);
    req.query.id = seg1;
    if (!seg2) return memosById(req, res);
    if (seg2 === 'submit') return memosSubmit(req, res);
    if (seg2 === 'cancel') return memosCancel(req, res);
    if (seg2 === 'export-pdf') return memosExportPdf(req, res);
    if (seg2 === 'versions') return memoVersions(req, res);
  }

  if (seg0 === 'workflow') {
    req.query.memoId = seg1;
    if (seg2 === 'approve') return workflowApprove(req, res);
    if (seg2 === 'reject') return workflowReject(req, res);
    if (seg2 === 'request-changes') return workflowRequestChanges(req, res);
    if (seg2 === 'forward') return workflowForward(req, res);
  }

  if (seg0 === 'comments') {
    if (!seg1) return commentsIndex(req, res);
    req.query.memoId = seg1;
    return commentsGet(req, res);
  }

  if (seg0 === 'attachments') {
    if (seg1 === 'download') {
      req.query.id = seg2;
      return attachmentsDownload(req, res);
    }
    req.query.memoId = seg1;
    return attachmentsUpload(req, res);
  }

  if (seg0 === 'notifications') {
    if (!seg1) return notificationsList(req, res);
    req.query.id = seg1;
    if (seg2 === 'read') return notificationsRead(req, res);
  }

  if (seg0 === 'admin') {
    if (seg1 === 'organization') return adminOrganization(req, res);
    if (seg1 === 'users') return adminUsers(req, res);
    if (seg1 === 'departments') return adminDepartments(req, res);
    if (seg1 === 'categories') return adminCategories(req, res);
    if (seg1 === 'dashboard') return adminDashboard(req, res);
    if (seg1 === 'audit-logs') return adminAuditLogs(req, res);
    if (seg1 === 'templates') return adminTemplates(req, res);
  }

  if (seg0 === 'search') return searchIndex(req, res);

  if (seg0 === 'dashboard' && seg1 === 'summary') return dashboardSummary(req, res);

  if (seg0 === 'messages') return messagesIndex(req, res);

  if (seg0 === 'join-requests') return joinRequestsIndex(req, res);

  if (seg0 === 'profile') return profileIndex(req, res);

  if (seg0 === 'delegations') return delegationsIndex(req, res);

  if (seg0 === 'platform') {
    if (seg1 === 'organizations') return platformOrganizations(req, res);
    if (seg1 === 'ban') return platformBan(req, res);
  }

  return res.status(404).json({ error: 'Not found', path: segments });
}
