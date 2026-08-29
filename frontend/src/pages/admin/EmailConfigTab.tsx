import { useEffect, useState } from 'react';
import { adminAPI } from '../../services/api';
import { useAuthStore } from '../../store/auth';
import { Mail, CheckCircle, AlertCircle, RefreshCw, Send, Globe } from 'lucide-react';
import clsx from 'clsx';

export function EmailConfigTab() {
  const { user } = useAuthStore();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [testEmail, setTestEmail] = useState(user?.email || '');

  const load = () => {
    setLoading(true);
    setError('');
    adminAPI.getEmailConfig()
      .then((r) => setData(r.data))
      .catch(() => setError('Failed to load email configuration'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const register = async () => {
    setBusy('register');
    setError('');
    setSuccess('');
    try {
      const r = await adminAPI.registerEmailDomain();
      setSuccess(r.data.message || 'Domain registered');
      load();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Registration failed');
    } finally {
      setBusy('');
    }
  };

  const verify = async () => {
    if (!data?.domain?.id) return;
    setBusy('verify');
    setError('');
    setSuccess('');
    try {
      const r = await adminAPI.verifyEmailDomain(data.domain.id);
      setSuccess(r.data.message || 'Verification started');
      load();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Verification failed');
    } finally {
      setBusy('');
    }
  };

  const testSend = async () => {
    setBusy('test');
    setError('');
    setSuccess('');
    try {
      const r = await adminAPI.sendTestEmail(testEmail);
      setSuccess(r.data.message || 'Test email sent');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Test send failed');
    } finally {
      setBusy('');
    }
  };

  if (loading) return <p className="text-gray-400 text-sm">Loading email configuration...</p>;

  const statusColor = (status: string) => {
    if (status === 'verified') return 'text-emerald-600 bg-emerald-50';
    if (status === 'pending') return 'text-amber-600 bg-amber-50';
    return 'text-gray-600 bg-gray-100';
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h2 className="text-lg font-bold text-charcoal mb-1 flex items-center gap-2">
          <Mail size={20} /> Resend Email (memobhai.online)
        </h2>
        <p className="text-sm text-gray-400">
          Verify your domain on Resend so OTP emails send from <code className="text-xs bg-surface-muted px-1 rounded">noreply@memobhai.online</code> to any user.
        </p>
      </div>

      {error && <p className="text-red-500 text-sm bg-red-50 px-4 py-3 rounded-2xl">{error}</p>}
      {success && <p className="text-emerald-600 text-sm bg-emerald-50 px-4 py-3 rounded-2xl">{success}</p>}

      {data?.ready ? (
        <div className="card border-emerald-200 bg-emerald-50/50 flex items-center gap-3">
          <CheckCircle className="text-emerald-600 shrink-0" size={22} />
          <div>
            <p className="font-semibold text-emerald-800">Production email ready</p>
            <p className="text-sm text-emerald-700">OTP emails can be sent to all users from your verified domain.</p>
          </div>
        </div>
      ) : (
        <div className="card border-amber-200 bg-amber-50/50 flex items-center gap-3">
          <AlertCircle className="text-amber-600 shrink-0" size={22} />
          <div>
            <p className="font-semibold text-amber-800">Setup incomplete</p>
            <p className="text-sm text-amber-700">Complete the checklist below to enable production email.</p>
          </div>
        </div>
      )}

      <div className="card space-y-3">
        <h3 className="font-semibold text-charcoal">Setup checklist</h3>
        {data?.checklist?.map((item: { id: string; label: string; done: boolean }) => (
          <div key={item.id} className="flex items-center gap-2 text-sm">
            {item.done ? <CheckCircle size={16} className="text-emerald-500" /> : <AlertCircle size={16} className="text-gray-300" />}
            <span className={item.done ? 'text-charcoal' : 'text-gray-400'}>{item.label}</span>
          </div>
        ))}
      </div>

      <div className="card space-y-3 text-sm">
        <h3 className="font-semibold text-charcoal">Current configuration</h3>
        <p><span className="text-gray-400">Mode:</span> <span className="capitalize font-medium">{data?.config?.mode}</span></p>
        <p><span className="text-gray-400">From:</span> <code className="text-xs bg-surface-muted px-1.5 py-0.5 rounded">{data?.config?.fromEmail}</code></p>
        <p><span className="text-gray-400">Reply-To:</span> {data?.config?.replyTo}</p>
        <p><span className="text-gray-400">Recommended From:</span> <code className="text-xs bg-surface-muted px-1.5 py-0.5 rounded">{data?.config?.recommendedFrom}</code></p>
        <p><span className="text-gray-400">API key:</span> {data?.config?.resendApiKeySet ? data.config.resendApiKeyPreview : 'Not set'}</p>
      </div>

      <div className="card space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <h3 className="font-semibold text-charcoal flex items-center gap-2"><Globe size={18} /> Domain: {data?.config?.domain || 'memobhai.online'}</h3>
          <div className="flex gap-2">
            {!data?.domain && (
              <button type="button" disabled={!!busy} onClick={register} className="btn-primary text-sm py-2 px-4">
                Add domain in Resend
              </button>
            )}
            {data?.domain && (
              <button type="button" disabled={!!busy} onClick={verify} className="btn-secondary text-sm py-2 px-4 flex items-center gap-1">
                <RefreshCw size={14} /> Re-verify DNS
              </button>
            )}
          </div>
        </div>

        {data?.domainError && <p className="text-red-500 text-sm">{data.domainError}</p>}

        {data?.domain && (
          <>
            <p className="text-sm">
              Status:{' '}
              <span className={clsx('px-2 py-0.5 rounded-full text-xs font-medium capitalize', statusColor(data.domain.status))}>
                {data.domain.status}
              </span>
            </p>
            {data.domain.records?.length > 0 && (
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="text-left text-gray-400 border-b">
                      <th className="py-2 pr-3">Type</th>
                      <th className="py-2 pr-3">Name</th>
                      <th className="py-2 pr-3">Value</th>
                      <th className="py-2">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.domain.records.map((r: any, i: number) => (
                      <tr key={i} className="border-b border-gray-50 align-top">
                        <td className="py-2 pr-3 font-mono">{r.type}</td>
                        <td className="py-2 pr-3 font-mono break-all">{r.name}</td>
                        <td className="py-2 pr-3 font-mono break-all max-w-xs">{r.value}</td>
                        <td className="py-2 capitalize">{r.status}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <p className="text-xs text-gray-400 mt-3">Add these DNS records at your memobhai.online registrar, then click Re-verify DNS.</p>
              </div>
            )}
          </>
        )}
      </div>

      <div className="card space-y-3">
        <h3 className="font-semibold text-charcoal flex items-center gap-2"><Send size={18} /> Send test OTP email</h3>
        <input className="input-field max-w-sm" value={testEmail} onChange={(e) => setTestEmail(e.target.value)} placeholder="test@example.com" />
        <button type="button" disabled={!!busy || !testEmail} onClick={testSend} className="btn-primary text-sm">Send test</button>
      </div>

      <div className="text-xs text-gray-400 space-y-1">
        <p>After domain is verified, set on Vercel Production:</p>
        <code className="block bg-surface-muted p-2 rounded-lg">OTP_FROM_EMAIL=MemoBhai &lt;noreply@memobhai.online&gt;</code>
        <code className="block bg-surface-muted p-2 rounded-lg">EMAIL_REPLY_TO=support@memobhai.online</code>
        <code className="block bg-surface-muted p-2 rounded-lg">RESEND_DOMAIN=memobhai.online</code>
      </div>
    </div>
  );
}
