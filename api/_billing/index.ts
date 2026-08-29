import type { VercelRequest, VercelResponse } from '@vercel/node';
import { resolveAuth } from '../_lib/auth';
import { prisma } from '../_lib/prisma';
import { apiHandler } from '../_lib/handler';
import { PLAN_LIMITS, getOrganizationPlanContext } from '../_lib/plans';
import {
  aamarpayConfig,
  apiBaseUrl,
  frontendBaseUrl,
  initiateAamarpayPayment,
  parseGatewayPayload,
} from '../_lib/aamarpay';

function generateTranId() {
  return `MB${Date.now()}`.slice(0, 32);
}

export default apiHandler(async (req: VercelRequest, res: VercelResponse) => {
  const ctx = await resolveAuth(req);

  // Public gateway callbacks (no auth)
  if (req.method === 'POST' && req.query.action === 'success') {
    return handleGatewayCallback(req, res, 'gateway_success');
  }
  if (req.method === 'POST' && req.query.action === 'fail') {
    return handleGatewayCallback(req, res, 'gateway_failed');
  }
  if (req.method === 'GET' && req.query.action === 'cancel') {
    const tranId = String(req.query.tran_id || '');
    if (tranId) {
      await prisma.subscriptionPayment.updateMany({
        where: { tranId, status: 'pending' },
        data: { status: 'cancelled' },
      });
    }
    return res.redirect(302, `${frontendBaseUrl()}/billing/cancel`);
  }

  if (!ctx) return res.status(401).json({ error: 'Unauthorized' });

  const isAdmin = ctx.role === 'admin' || ctx.isPlatformAdmin;

  if (req.method === 'GET') {
    if (!isAdmin) {
      return res.status(403).json({ error: 'Only organization administrators can view billing' });
    }

    const where = ctx.isPlatformAdmin
      ? {}
      : { organizationId: ctx.organizationId };

    const [payments, planCtx] = await Promise.all([
      prisma.subscriptionPayment.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: 50,
        include: { organization: { select: { id: true, name: true, slug: true, plan: true } } },
      }),
      getOrganizationPlanContext(ctx.organizationId),
    ]);

    return res.json({
      payments,
      subscription: {
        plan: planCtx.plan,
        planExpiresAt: planCtx.planExpiresAt,
        limits: planCtx.limits,
        usage: planCtx.usage,
        memosThisMonth: planCtx.usage.memosThisMonth,
      },
    });
  }

  if (req.method === 'POST' && req.query.action === 'initiate') {
    // Org admins (including pending new-org founders) and platform admins can pay
    const canPay = ctx.role === 'admin' || ctx.isPlatformAdmin;
    if (!canPay) return res.status(403).json({ error: 'Only organization administrators can purchase a plan' });

    const { plan = 'professional', cus_phone } = req.body as { plan?: string; cus_phone?: string };
    if (plan !== 'professional') {
      return res.status(400).json({ error: 'Only Professional plan can be purchased online. Contact us for Enterprise.' });
    }

    const amount = PLAN_LIMITS.professional.priceBdt!;
    const tranId = generateTranId();
    const cfg = aamarpayConfig();
    const base = apiBaseUrl();

    const user = await prisma.user.findUnique({
      where: { id: ctx.userId },
      select: { name: true, email: true },
    });

    const payment = await prisma.subscriptionPayment.create({
      data: {
        organizationId: ctx.organizationId,
        tranId,
        plan: 'professional',
        amount,
        currency: 'BDT',
        status: 'pending',
        customerName: user?.name || 'Admin',
        customerEmail: user?.email || ctx.email,
        customerPhone: cus_phone || '01700000000',
      },
    });

    const payload = {
      store_id: cfg.storeId,
      signature_key: cfg.signatureKey,
      tran_id: tranId,
      amount: String(amount),
      currency: 'BDT',
      desc: 'MemoBhai Professional Plan (Sandbox)',
      cus_name: payment.customerName,
      cus_email: payment.customerEmail,
      cus_phone: payment.customerPhone || '01700000000',
      success_url: `${base}/api/billing?action=success`,
      fail_url: `${base}/api/billing?action=fail`,
      cancel_url: `${base}/api/billing?action=cancel&tran_id=${tranId}`,
      opt_a: ctx.organizationId,
      opt_b: payment.id,
    };

    const gateway = await initiateAamarpayPayment(payload);
    if (gateway.result !== 'true' || !gateway.payment_url) {
      await prisma.subscriptionPayment.update({
        where: { id: payment.id },
        data: { status: 'gateway_failed', rawResponse: JSON.stringify(gateway) },
      });
      return res.status(502).json({ error: gateway.message || 'Payment gateway error' });
    }

    await prisma.subscriptionPayment.update({
      where: { id: payment.id },
      data: { paymentUrl: gateway.payment_url },
    });

    return res.json({ payment_url: gateway.payment_url, tran_id: tranId });
  }

  if (req.method === 'POST' && req.query.action === 'confirm') {
    if (!isAdmin) return res.status(403).json({ error: 'Admin access required' });

    const { paymentId } = req.body as { paymentId: string };
    const payment = await prisma.subscriptionPayment.findUnique({ where: { id: paymentId } });
    if (!payment) return res.status(404).json({ error: 'Payment not found' });
    if (!ctx.isPlatformAdmin && payment.organizationId !== ctx.organizationId) {
      return res.status(403).json({ error: 'Not authorized' });
    }
    if (payment.status !== 'gateway_success') {
      return res.status(400).json({ error: 'Payment must be successful at gateway before manual confirmation' });
    }

    const expires = new Date();
    expires.setMonth(expires.getMonth() + 1);

    await prisma.$transaction([
      prisma.subscriptionPayment.update({
        where: { id: paymentId },
        data: {
          status: 'admin_confirmed',
          adminConfirmedAt: new Date(),
          adminConfirmedById: ctx.userId,
        },
      }),
      prisma.organization.update({
        where: { id: payment.organizationId },
        data: { plan: payment.plan, planExpiresAt: expires },
      }),
      prisma.auditLog.create({
        data: {
          organizationId: payment.organizationId,
          userId: ctx.userId,
          event: 'plan_upgraded',
          entityType: 'subscription',
          entityId: paymentId,
          description: `Plan upgraded to ${payment.plan} after manual admin confirmation (tran ${payment.tranId})`,
        },
      }),
    ]);

    return res.json({ success: true, plan: payment.plan, planExpiresAt: expires });
  }

  return res.status(405).json({ error: 'Method not allowed' });
});

async function handleGatewayCallback(
  req: VercelRequest,
  res: VercelResponse,
  status: 'gateway_success' | 'gateway_failed',
) {
  const data = parseGatewayPayload(req);
  const tranId = String(data.mer_txnid || data.tran_id || '');
  const statusCode = String(data.status_code || '');

  if (tranId) {
    const payment = await prisma.subscriptionPayment.findUnique({ where: { tranId } });
    if (payment) {
      const success = status === 'gateway_success' && statusCode === '2';
      await prisma.subscriptionPayment.update({
        where: { id: payment.id },
        data: {
          status: success ? 'gateway_success' : 'gateway_failed',
          gatewayStatus: String(data.pay_status || statusCode),
          gatewayTxnId: String(data.pg_txnid || data.epw_txnid || ''),
          rawResponse: JSON.stringify(data),
        },
      });
    }
  }

  const dest =
    status === 'gateway_success'
      ? `${frontendBaseUrl()}/billing/success?tran_id=${encodeURIComponent(tranId)}`
      : `${frontendBaseUrl()}/billing/fail?tran_id=${encodeURIComponent(tranId)}`;

  return res.redirect(302, dest);
}
