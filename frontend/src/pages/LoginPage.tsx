import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../store/auth';
import { authAPI } from '../services/api';
import AuthLayout from '../components/AuthLayout';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [slowHint, setSlowHint] = useState(false);
  const navigate = useNavigate();
  const { setAuth, clearAuth } = useAuthStore();

  useEffect(() => {
    if (!loading) {
      setSlowHint(false);
      return;
    }
    const id = window.setTimeout(() => setSlowHint(true), 4000);
    return () => window.clearTimeout(id);
  }, [loading]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSlowHint(false);
    // Drop stale session so bootstrap / interceptors cannot race this login
    clearAuth();
    try {
      const response = await authAPI.login(email, password);
      const { token, user, organization, pending } = response.data;
      setAuth(token, user, organization);
      if (pending || user?.status === 'pending' || organization?.status === 'pending') {
        navigate('/pending', { replace: true });
      } else {
        navigate('/dashboard', { replace: true });
      }
    } catch (err: any) {
      if (err.code === 'ECONNABORTED') {
        setError('Server is waking up. Please try again in a few seconds.');
      } else {
        setError(err.response?.data?.error || 'Login failed');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout title="MemoBhai" subtitle="Sign in to your account">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="bg-red-50 text-red-500 px-4 py-3 rounded-2xl text-sm">{error}</div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-500 mb-1.5">Email</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="input-field" placeholder="you@example.com" />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-500 mb-1.5">Password</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required className="input-field" placeholder="Your password" />
        </div>

        <button type="submit" disabled={loading} className="btn-primary w-full py-3">
          {loading ? 'Signing in...' : 'Sign in'}
        </button>
        {slowHint && loading && (
          <p className="text-center text-xs text-gray-400">
            Server may be waking from sleep — this can take up to 30 seconds on first load.
          </p>
        )}
        <p className="text-center text-sm">
          <Link to="/forgot-password" className="text-accent-dark font-medium hover:underline">Forgot password?</Link>
        </p>
      </form>

      <p className="text-center text-gray-400 text-sm mt-6">
        Don't have an account?{' '}
        <Link to="/register" className="text-accent-dark font-medium hover:underline">Register</Link>
      </p>
    </AuthLayout>
  );
}
