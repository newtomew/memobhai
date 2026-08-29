import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { billingAPI } from '../services/api';
import { CreditCard, CheckCircle, AlertCircle } from 'lucide-react';

export default function BillingPage() {
  const [sub, setSub] = useState<any>(null);
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [phone, setPhone] = useState('01700000000');

  const load = () => {
    setLoading(true);
    billingAPI.get().then((r) => {
      setSub(r.data.subscription);
      setPayments(r.data.payments || []);
    }).catch(() => setError('Failed to load billing')).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const upgrade = async () => {
    setBusy(true);
    setError('');
    try {
      const res = await billingAPI.initiate('professional', phone);
      if (res.data.payment_url) window.location.href = res.data.payment_url;
      else setError('No payment URL returned');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Payment initiation failed');
    } finally {
      setBusy(false);
    }
  };

  const confirm = async (paymentId: string) => {
    setBusy(true);
    setError('');
    try {
      await billingAPI.confirm(paymentId);
      load();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Confirmation failed');
    } finally {
      setBusy(false);
    }
  };

  if (loading) return <p className="text-gray-400">Loading billing...</p>;

  const limits = sub?.limits;
  const usage = sub?.usage || {};

  return (
    <div className="max-w-3xl mx-auto space-y-6 slide-up">
      <div>
        <h1 className="text-2xl font-bold text-charcoal">Subscription and Billing</h1>
        <p className="text-gray-400 text-sm mt-1">Plan limits are enforced across memos, users, and workflows.</p>
      </div>

      {error && <p className="text-red-500 text-sm bg-red-50 px-4 py-3 rounded-2xl">{error}</p>}

      <div className="card">
        <div className="flex items-center gap-3 mb-4">
          <CreditCard className="text-accent-dark" size={22} />
          <h2 className="font-bold text-charcoal capitalize">Current plan: {sub?.plan || 'starter'}</h2>
        </div>
        {limits && (
          <ul className="text-sm text-gray-600 space-y-2 mb-4">
            <li>Users: {usage.users ?? 0}{limits.maxUsers != null ? ` / ${limits.maxUsers}` : ' (unlimited)'}</li>
            <li>Memos this month: {usage.memosThisMonth ?? 0}{limits.maxMemosPerMonth != null ? ` / ${limits.maxMemosPerMonth}` : ' (unlimited)'}</li>
            <li>Max workflow steps: {limits.maxWorkflowSteps ?? 'Unlimited'}</li>
          </ul>
        )}
        {sub?.plan !== 'professional' && sub?.plan !== 'enterprise' && (
          <div className="border-t border-gray-100 pt-4 mt-4">
            <p className="text-sm text-gray-500 mb-3">Upgrade to Professional (৳2,999/month) via aamarPay sandbox. Admin must confirm after payment.</p>
            <input className="input-field mb-3 max-w-xs" placeholder="Phone (e.g. 01700000000)" value={phone} onChange={(e) => setPhone(e.target.value)} />
            <button type="button" disabled={busy} onClick={upgrade} className="btn-primary">Pay with aamarPay Sandbox</button>
          </div>
        )}
      </div>

      <div className="card">
        <h2 className="font-bold text-charcoal mb-4">Payment history</h2>
        {payments.length === 0 ? (
          <p className="text-gray-400 text-sm">No payments yet.</p>
        ) : (
          <div className="space-y-3">
            {payments.map((p) => (
              <div key={p.id} className="flex flex-wrap items-center justify-between gap-3 py-3 border-b border-gray-50 last:border-0">
                <div>
                  <p className="font-medium text-sm text-charcoal capitalize">{p.plan} · ৳{p.amount}</p>
                  <p className="text-xs text-gray-400">{p.tranId} · {p.status.replace(/_/g, ' ')}</p>
                </div>
                {p.status === 'gateway_success' && (
                  <button type="button" disabled={busy} onClick={() => confirm(p.id)} className="btn-primary text-sm py-2 px-4 flex items-center gap-1">
                    <CheckCircle size={14} /> Confirm upgrade
                  </button>
                )}
                {p.status === 'admin_confirmed' && (
                  <span className="text-xs text-emerald-600 flex items-center gap-1"><CheckCircle size={14} /> Confirmed</span>
                )}
                {p.status === 'gateway_failed' && (
                  <span className="text-xs text-red-500 flex items-center gap-1"><AlertCircle size={14} /> Failed</span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <Link to="/admin" className="text-sm text-accent-dark hover:underline">Back to admin</Link>
    </div>
  );
}
