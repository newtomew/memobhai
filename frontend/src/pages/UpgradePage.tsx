import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { billingAPI } from '../services/api';
import { useAuthStore } from '../store/auth';
import AuthLayout from '../components/AuthLayout';
import { CreditCard, CheckCircle, AlertCircle, ArrowLeft } from 'lucide-react';

function UpgradeCheckout({ standalone }: { standalone?: boolean }) {
  const { isOrgAdmin, isPlatformAdmin, isPending } = useAuthStore();
  const canPurchase = isOrgAdmin() || isPlatformAdmin();

  const [sub, setSub] = useState<any>(null);
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [phone, setPhone] = useState('01700000000');

  const load = () => {
    if (!canPurchase) {
      setLoading(false);
      return;
    }
    setLoading(true);
    billingAPI.get()
      .then((r) => {
        setSub(r.data.subscription);
        setPayments(r.data.payments || []);
      })
      .catch(() => setError('Failed to load billing'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [canPurchase]);

  const upgrade = async () => {
    setBusy(true);
    setError('');
    try {
      const res = await billingAPI.initiate('professional', phone);
      if (res.data.payment_url) {
        window.location.href = res.data.payment_url;
      } else {
        setError('No payment URL returned');
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Payment initiation failed');
    } finally {
      setBusy(false);
    }
  };

  if (!canPurchase) {
    return (
      <div className="space-y-4">
        <p className="text-gray-500 text-sm">
          Only organization administrators can purchase a plan. Ask your org admin to upgrade, or register a new organization.
        </p>
        <Link to="/dashboard" className="btn-secondary inline-block text-sm">Back to dashboard</Link>
      </div>
    );
  }

  if (loading) return <p className="text-gray-400">Loading...</p>;

  const limits = sub?.limits;
  const usage = sub?.usage || {};
  const alreadyPro = sub?.plan === 'professional' || sub?.plan === 'enterprise';
  const pendingPayment = payments.some((p) => p.status === 'gateway_success');

  return (
    <div className="space-y-6">
      {error && <p className="text-red-500 text-sm bg-red-50 px-4 py-3 rounded-2xl">{error}</p>}

      {isPending() && (
        <div className="bg-amber-50 border border-amber-100 text-amber-800 text-sm px-4 py-3 rounded-2xl">
          Your organization is still awaiting approval. You can complete payment now; platform admin will activate your Professional plan after reviewing your account.
        </div>
      )}

      <div className={standalone ? 'space-y-4' : 'card space-y-4'}>
        <div className="flex items-center gap-3">
          <CreditCard className="text-accent-dark" size={22} />
          <div>
            <h2 className="font-bold text-charcoal capitalize">Professional Plan · ৳2,999/month</h2>
            <p className="text-xs text-gray-400">Current: {sub?.plan || 'starter'}</p>
          </div>
        </div>

        {limits && (
          <ul className="text-sm text-gray-600 space-y-1">
            <li>Users: {usage.users ?? 0}{limits.maxUsers != null ? ` / ${limits.maxUsers}` : ''}</li>
            <li>Memos this month: {usage.memosThisMonth ?? 0}{limits.maxMemosPerMonth != null ? ` / ${limits.maxMemosPerMonth}` : ' (unlimited after upgrade)'}</li>
          </ul>
        )}

        {!alreadyPro && (
          <div className="border-t border-gray-100 pt-4 space-y-3">
            <p className="text-sm text-gray-500">
              Pay securely via aamarPay sandbox. After payment, your admin confirms the upgrade (automatic for platform owners).
            </p>
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1.5">Mobile number (aamarPay)</label>
              <input
                className="input-field max-w-xs"
                placeholder="01700000000"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
            <button type="button" disabled={busy} onClick={upgrade} className="btn-primary w-full sm:w-auto px-8">
              {busy ? 'Redirecting to payment...' : 'Pay ৳2,999 with aamarPay'}
            </button>
          </div>
        )}

        {alreadyPro && (
          <p className="text-emerald-600 text-sm flex items-center gap-2">
            <CheckCircle size={16} /> Your organization is on the {sub.plan} plan.
          </p>
        )}

        {pendingPayment && !alreadyPro && (
          <p className="text-amber-600 text-sm flex items-center gap-2">
            <AlertCircle size={16} /> Payment received. Waiting for admin confirmation to activate Professional limits.
          </p>
        )}
      </div>

      {payments.length > 0 && (
        <div className={standalone ? 'space-y-2' : 'card space-y-2'}>
          <h3 className="font-semibold text-charcoal text-sm">Recent payments</h3>
          {payments.slice(0, 3).map((p) => (
            <p key={p.id} className="text-xs text-gray-400">
              ৳{p.amount} · {p.tranId} · {p.status.replace(/_/g, ' ')}
            </p>
          ))}
        </div>
      )}

      {!standalone && (
        <Link to={isPending() ? '/pending' : '/dashboard'} className="text-sm text-accent-dark hover:underline inline-flex items-center gap-1">
          <ArrowLeft size={14} /> Back
        </Link>
      )}
    </div>
  );
}

/** Checkout for Premium — works while account is still pending approval. */
export default function UpgradePage() {
  const { isPending } = useAuthStore();

  if (isPending()) {
    return (
      <AuthLayout title="Upgrade to Professional" subtitle="৳2,999/month · aamarPay sandbox">
        <UpgradeCheckout standalone />
        <p className="text-center mt-6">
          <Link to="/pending" className="text-sm text-gray-400 hover:text-charcoal">Back to approval status</Link>
        </p>
      </AuthLayout>
    );
  }

  return (
    <div className="max-w-3xl mx-auto slide-up">
      <h1 className="text-2xl font-bold text-charcoal mb-6">Upgrade to Professional</h1>
      <UpgradeCheckout />
    </div>
  );
}
