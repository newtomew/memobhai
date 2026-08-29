# Resend Domain Setup (Item 6) — memobhai.online

This guide completes production email for MemoBhai OTP messages (profile email change, password change).

## Goal

Send OTP emails from **`noreply@memobhai.online`** to **any user email**, not only Resend sandbox test addresses.

---

## Step 1: Resend account

1. Log in at [resend.com](https://resend.com)
2. Confirm your **API key** is set on Vercel as `RESEND_API_KEY` (Production + Preview)

---

## Step 2: Add domain (choose one)

### Option A — Platform Admin UI (recommended)

1. Log in as a **platform admin** (`PLATFORM_ADMIN_EMAILS`)
2. Go to **Platform → Email Setup**
3. Click **Add domain in Resend**
4. Copy the DNS records shown in the table

### Option B — Resend dashboard

1. Resend → **Domains** → **Add Domain**
2. Enter: `memobhai.online`
3. Copy SPF, DKIM, and MX records for the `send` subdomain

---

## Step 3: DNS at your domain registrar

Add **exactly** the records Resend provides. Typical records look like:

| Type | Name | Value |
|------|------|-------|
| TXT | `resend._domainkey` | (DKIM key from Resend) |
| TXT | `send` | `v=spf1 include:amazonses.com ~all` |
| MX | `send` | `feedback-smtp.us-east-1.amazonses.com` (priority 10) |

**Important:**
- Add records at the DNS host that controls `memobhai.online` (registrar or Cloudflare)
- Use exact values from Resend (copy/paste)
- Propagation can take 15 minutes to 72 hours

Verify publicly: [dns.email](https://dns.email)

---

## Step 4: Verify domain

1. In **Platform → Email Setup**, click **Re-verify DNS**
2. Wait until status shows **`verified`**

Or in Resend dashboard: Domains → memobhai.online → **Verify**

---

## Step 5: Update Vercel environment variables

Set on **Production** and **Preview**:

```env
RESEND_API_KEY=re_your_key_here
RESEND_DOMAIN=memobhai.online
OTP_FROM_EMAIL=MemoBhai <noreply@memobhai.online>
EMAIL_REPLY_TO=support@memobhai.online
APP_PUBLIC_URL=https://memobhai.vercel.app
```

Remove or replace the sandbox value:
```env
# OLD (sandbox only — remove after verification)
OTP_FROM_EMAIL=MemoBhai <onboarding@resend.dev>
```

Redeploy after changing env vars:
```bash
npx vercel deploy --prod
```

Or sync from `.env.local`:
```bash
node scripts/sync-vercel-env.mjs
```

---

## Step 6: Test

1. **Platform → Email Setup → Send test** (sends OTP code `123456` to your email)
2. **Profile page** → Change password → request OTP (real flow)

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| Domain stuck on `pending` | Re-verify; check DNS with dns.email; wait up to 72h |
| `validation_error` on send | `OTP_FROM_EMAIL` must use `@memobhai.online` after verification |
| Sandbox works, production fails | Domain not verified or wrong From address |
| Only some emails receive | Sandbox mode limits recipients; switch to verified domain |

---

## What changed in the app (Item 6)

- `api/_lib/email.ts` — production From/Reply-To, branded HTML, no sandbox default once env set
- `api/_lib/resend.ts` — Resend Domains API client
- `api/_admin/email.ts` — platform admin: status, register, verify, test send
- **Platform → Email Setup** UI with DNS record table and checklist

---

## Security notes

- Never commit `RESEND_API_KEY` to git
- Platform admin only can manage domain configuration
- OTP codes expire in 10 minutes (unchanged)
