import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../store/auth';
import { authAPI } from '../services/api';
import AuthLayout from '../components/AuthLayout';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const response = await authAPI.login(email, password);
      const { token, user, organization } = response.data;
      setAuth(token, user, organization);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Login failed');
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
      </form>

      <p className="text-center text-gray-400 text-sm mt-6">
        Don't have an account?{' '}
        <Link to="/register" className="text-accent-dark font-medium hover:underline">Register</Link>
      </p>
    </AuthLayout>
  );
}
