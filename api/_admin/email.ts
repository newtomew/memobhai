import type { VercelRequest, VercelResponse } from '@vercel/node';
import { resolveAuth } from '../_lib/auth';
import { apiHandler } from '../_lib/handler';
import { sendOtpEmail, getEmailConfig } from '../_lib/email';
import {
  createResendDomain,
  findDomainByName,
  getConfiguredEmailDomain,
  getResendDomain,
  maskApiKey,
  verifyResendDomain,
} from '../_lib/resend';

export default apiHandler(async (req: VercelRequest, res: VercelResponse) => {
  const ctx = await resolveAuth(req);
  if (!ctx) return res.status(401).json({ error: 'Unauthorized' });
  if (!ctx.isPlatformAdmin) return res.status(403).json({ error: 'Platform admin access required' });

  const domainName = getConfiguredEmailDomain();
  const config = getEmailConfig();

  if (req.method === 'GET') {
    let domain = null;
    let domainError: string | null = null;

    if (process.env.RESEND_API_KEY) {
      try {
        domain = await findDomainByName(domainName);
      } catch (err: unknown) {
        domainError = err instanceof Error ? err.message : 'Failed to fetch domain from Resend';
      }
    }

    const verified = domain?.status === 'verified';
    const usingProductionFrom = config.fromEmail.includes('@memobhai.online')
      || config.fromEmail.includes(`@${domainName}`);

    return res.json({
      config: {
        ...config,
        resendApiKeySet: Boolean(process.env.RESEND_API_KEY),
        resendApiKeyPreview: maskApiKey(process.env.RESEND_API_KEY || ''),
        recommendedFrom: `MemoBhai <noreply@${domainName}>`,
        recommendedReplyTo: `support@${domainName}`,
      },
      domain: domain
        ? {
            id: domain.id,
            name: domain.name,
            status: domain.status,
            region: domain.region,
            records: domain.records || [],
          }
        : null,
      domainError,
      ready: verified && usingProductionFrom && Boolean(process.env.RESEND_API_KEY),
      checklist: [
        { id: 'api_key', label: 'RESEND_API_KEY set on Vercel', done: Boolean(process.env.RESEND_API_KEY) },
        { id: 'domain_added', label: `${domainName} added in Resend`, done: Boolean(domain) },
        { id: 'domain_verified', label: 'Domain DNS verified', done: verified },
        { id: 'from_email', label: 'OTP_FROM_EMAIL uses verified domain', done: usingProductionFrom },
      ],
    });
  }

  if (req.method === 'POST') {
    const action = req.query.action as string;

    if (action === 'register') {
      try {
        const existing = await findDomainByName(domainName);
        if (existing) {
          const full = await findDomainByName(domainName);
          return res.json({ domain: full, message: 'Domain already registered in Resend' });
        }
        const created = await createResendDomain(domainName);
        const full = created?.id ? await getResendDomain(created.id) : created;
        return res.json({ domain: full, message: 'Domain registered. Add DNS records below.' });
      } catch (err: unknown) {
        return res.status(400).json({ error: err instanceof Error ? err.message : 'Registration failed' });
      }
    }

    if (action === 'verify') {
      const { domainId } = req.body as { domainId?: string };
      if (!domainId) return res.status(400).json({ error: 'domainId required' });
      try {
        await verifyResendDomain(domainId);
        const domain = await findDomainByName(domainName);
        return res.json({ success: true, domain, message: 'Verification started. DNS may take up to 72 hours.' });
      } catch (err: unknown) {
        return res.status(400).json({ error: err instanceof Error ? err.message : 'Verification failed' });
      }
    }

    if (action === 'test') {
      const { to } = req.body as { to?: string };
      const recipient = to || ctx.email;
      if (!recipient) return res.status(400).json({ error: 'Recipient email required' });
      try {
        await sendOtpEmail(recipient, '123456', 'change_password');
        return res.json({ success: true, message: `Test OTP email sent to ${recipient}` });
      } catch (err: unknown) {
        return res.status(400).json({ error: err instanceof Error ? err.message : 'Test send failed' });
      }
    }

    return res.status(400).json({ error: 'Unknown action' });
  }

  return res.status(405).json({ error: 'Method not allowed' });
});
