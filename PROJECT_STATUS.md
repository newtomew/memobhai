# MemoBhai — Project Status

**Last updated:** August 2026  
**Live:** https://memobhai.vercel.app  
**Stack:** React 18 + Vite, Vercel serverless API, Prisma + Supabase Auth + PostgreSQL

## Summary

MemoBhai is a multi-tenant inter-office memo management system with sequential approval workflows, platform super-admin oversight, rich text memos, version history, delegations, messaging, and PDF export.

**Status:** Feature-complete for MVP / PRD demo. All critical gaps from the gap analysis have been addressed in this release.

---

## Completed Features

### Core memo lifecycle (MR-011–020)
- Create, draft, edit, delete, submit
- Edit draft and **changes_requested** memos
- **Resubmit after changes requested** — edit + new workflow chain
- **Cancel memo** — author, org admin, or platform admin
- All statuses including `cancelled`
- Rich text body (TipTap): bold, italic, underline, lists, headings, alignment, **links**, **tables**, **inline images**

### Workflow (MR-015–019, US-09–11)
- Sequential approve / reject / request changes / forward
- Delegation support in workflow actions
- Workflow steps UI + **approval history panel** on memo detail
- Workflow templates: create, **edit**, delete, pick on memo create

### Attachments (MR-026–027)
- Upload / download via Supabase Storage
- **10 MB limit** + MIME type allowlist (PDF, images, Office, text)

### Version history (Issue 8, US-21)
- Snapshots on draft edit and on resubmit
- Org admin + author + **platform admin cross-org** access
- Version panel renders **HTML** (rich text), not plain text

### Platform admin (Issue 7)
- Org list, ban/unban orgs/users/memos
- Cross-org memo drill-down via **View** and **Versions** links (`?versions=1` opens history panel)
- **Join approvals** tab on `/platform` — new orgs & manager requests only (employee joins stay on org `/admin`)
- Platform admins may access `/admin` routes via `AdminRoute`

### Admin & reporting (MR-044, US-19)
- Dashboard stats: users, memos, pending, urgent, rejection rate
- **Avg completion time (hours)**
- Memos by department/category with bar charts
- **Status breakdown** chart
- Audit logs, categories, departments, templates, join requests

### Auth & profile
- Register (org create / join request), login, forgot/reset password (Supabase)
- Profile OTP email verification (Resend sandbox)
- Pending approval flow for new orgs/managers

### Other
- Inbox filters/sort, search, notifications, internal messages
- PDF export with approval chain, history, comments; **org logo** when configured
- Branding: app logo, email HTML templates
- Lazy-loaded routes, code splitting (~482 KB initial bundle)
- Message badge polling every 45s; notifications every 2 min
- Mobile-friendly layout (responsive flex/grid on key pages)

---

## Intentionally excluded / deferred

| Item | Notes |
|------|--------|
| Resend verified domain (Item 6) | Setup guide: RESEND_DOMAIN_SETUP.md · Platform → Email Setup UI |
| Memo email notifications (MR-029) | In-app notifications only |
| Real-time WebSocket messages | Polling-based (45s) |
| Full mobile-native UX | Desktop-first, responsive web |

---

## Environment variables

See `.env.local.template` for:
- Supabase (`VITE_SUPABASE_*`, `SUPABASE_*`)
- Database (`DATABASE_URL`, `DIRECT_URL`)
- `PLATFORM_ADMIN_EMAILS` (max 3)
- `RESEND_API_KEY`, `OTP_FROM_EMAIL`
- `VITE_FRONTEND_URL` / `FRONTEND_URL`

---

## Demo credentials

Run `npm run db:seed` locally. See `DEMO_CREDENTIALS.md` (gitignored) for passwords.

- **Platform owner:** `zahidhoshen.masud@gmail.com` / org `memobhai-hq`
- **Demo orgs:** `admin@demo.com` etc. — password `Demo123!`

---

## Known operational notes

- **Cold starts / DB region:** First request after idle may exceed 3s (Supabase pooler in ap-northeast-1). Mitigations: auth cache, lazy routes, reduced polling.
- **PDF org logo:** Requires org `logo` URL accessible with CORS; falls back to text letterhead.
- **Deploy:** Push to GitHub or `npx vercel --prod` to update production.

---

## Quick test checklist

Run automated suite: `npm run test:audit` and `npm run test:e2e`

1. Login → dashboard loads
2. Create memo → rich text → workflow → submit
3. Approver: approve / reject / request changes
4. Author: edit + resubmit after changes requested
5. Cancel memo from detail page
6. Admin: edit workflow template, view reports
7. Platform admin: org list, join approvals, cross-org memo + version history
8. PDF download includes history
9. Attachment upload >10 MB rejected
