import { useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import AuthLayout from '../components/AuthLayout';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');
    try {
      const base =
        (import.meta.env.VITE_FRONTEND_URL as string | undefined)?.replace(/\/$/, '') ||
        window.location.origin;
      const redirectTo = `${base}/reset-password`;
      const { error: err } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });
      if (err) throw err;
      setMessage('Password reset link sent. Check your email inbox.');
    } catch (err: any) {
      setError(err.message || 'Failed to send reset email');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout title="Reset Password" subtitle="We'll email you a secure reset link">
      <form onSubmit={handleSubmit} className="space-y-4">
        {message && <div className="bg-emerald-50 text-emerald-600 px-4 py-3 rounded-2xl text-sm">{message}</div>}
        {error && <div className="bg-red-50 text-red-500 px-4 py-3 rounded-2xl text-sm">{error}</div>}
        <div>
          <label className="block text-sm font-medium text-gray-500 mb-1.5">Email</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="input-field" placeholder="you@example.com" />
        </div>
        <button type="submit" disabled={loading} className="btn-primary w-full py-3">
          {loading ? 'Sending...' : 'Send Reset Link'}
        </button>
      </form>
      <p className="text-center text-gray-400 text-sm mt-6">
        <Link to="/login" className="text-accent-dark font-medium hover:underline">Back to sign in</Link>
      </p>
    </AuthLayout>
  );
}
