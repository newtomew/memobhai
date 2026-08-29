import { Link, useSearchParams } from 'react-router-dom';
import { CheckCircle, XCircle } from 'lucide-react';

function BillingResult({ success }: { success: boolean }) {
  const [params] = useSearchParams();
  const tranId = params.get('tran_id');

  return (
    <div className="min-h-screen bg-landing-bg flex items-center justify-center p-6">
      <div className="max-w-md w-full rounded-3xl border border-landing-border bg-landing-card p-8 text-center">
        {success ? (
          <>
            <CheckCircle className="mx-auto text-emerald-400 mb-4" size={48} />
            <h1 className="text-xl font-bold text-white mb-2">Payment received</h1>
            <p className="text-landing-muted text-sm mb-6">
              Your sandbox payment was successful. Your organization admin must manually confirm the upgrade before Professional limits apply.
            </p>
          </>
        ) : (
          <>
            <XCircle className="mx-auto text-red-400 mb-4" size={48} />
            <h1 className="text-xl font-bold text-white mb-2">Payment failed</h1>
            <p className="text-landing-muted text-sm mb-6">The payment could not be completed. You can try again from the billing page.</p>
          </>
        )}
        {tranId && <p className="text-xs text-landing-muted mb-6 font-mono">Ref: {tranId}</p>}
        <div className="flex flex-col gap-2">
          <Link to="/upgrade" className="bg-accent text-charcoal font-semibold py-3 rounded-full">Go to Upgrade</Link>
          <Link to="/" className="text-sm text-landing-muted hover:text-white py-2">Back to home</Link>
        </div>
      </div>
    </div>
  );
}

export function BillingSuccessPage() {
  return <BillingResult success />;
}

export function BillingFailPage() {
  return <BillingResult success={false} />;
}

export function BillingCancelPage() {
  return (
    <div className="min-h-screen bg-landing-bg flex items-center justify-center p-6">
      <div className="max-w-md w-full rounded-3xl border border-landing-border bg-landing-card p-8 text-center">
        <h1 className="text-xl font-bold text-white mb-2">Payment cancelled</h1>
        <p className="text-landing-muted text-sm mb-6">You cancelled the payment. No charges were made.</p>
        <Link to="/upgrade" className="bg-accent text-charcoal font-semibold py-3 px-6 rounded-full inline-block">Try again</Link>
      </div>
    </div>
  );
}
