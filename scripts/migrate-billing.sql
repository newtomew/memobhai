-- Run in Supabase SQL Editor if `prisma db push` fails on permissions.
-- Adds subscription billing fields for plan rate limiting.

ALTER TABLE organizations ADD COLUMN IF NOT EXISTS plan TEXT NOT NULL DEFAULT 'starter';
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS "planExpiresAt" TIMESTAMPTZ;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS "memoCountThisMonth" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS "memoCountResetAt" TIMESTAMPTZ;

CREATE TABLE IF NOT EXISTS subscription_payments (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "organizationId" TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  "tranId" TEXT NOT NULL UNIQUE,
  plan TEXT NOT NULL,
  amount DOUBLE PRECISION NOT NULL,
  currency TEXT NOT NULL DEFAULT 'BDT',
  status TEXT NOT NULL DEFAULT 'pending',
  "gatewayStatus" TEXT,
  "gatewayTxnId" TEXT,
  "paymentUrl" TEXT,
  "customerName" TEXT NOT NULL,
  "customerEmail" TEXT NOT NULL,
  "customerPhone" TEXT,
  "adminConfirmedAt" TIMESTAMPTZ,
  "adminConfirmedById" TEXT,
  "rawResponse" TEXT,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS subscription_payments_organization_id_idx ON subscription_payments("organizationId");
CREATE INDEX IF NOT EXISTS subscription_payments_status_idx ON subscription_payments(status);
