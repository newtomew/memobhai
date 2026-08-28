import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../store/auth';
import { authAPI } from '../services/api';
import AuthLayout from '../components/AuthLayout';

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    organizationName: '',
    organizationSlug: '',
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (formData.password !== formData.confirmPassword) { setError('Passwords do not match'); return; }
    setLoading(true);
    try {
      const response = await authAPI.register({
        organizationName: formData.organizationName,
        organizationSlug: formData.organizationSlug,
        name: formData.name,
        email: formData.email,
        password: formData.password,
      });
      const { token, user, organization } = response.data;
      setAuth(token, user, organization);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout title="Create Organization" subtitle="Set up your MemoBhai workspace">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="bg-red-50 text-red-500 px-4 py-3 rounded-2xl text-sm">{error}</div>
        )}

        {[
          { name: 'organizationName', label: 'Organization Name', placeholder: 'Acme Corporation' },
          { name: 'organizationSlug', label: 'Organization Slug', placeholder: 'acme-corp' },
          { name: 'name', label: 'Full Name', placeholder: 'John Doe' },
          { name: 'email', label: 'Email', placeholder: 'admin@acme.com', type: 'email' },
          { name: 'password', label: 'Password', placeholder: 'At least 8 characters', type: 'password' },
          { name: 'confirmPassword', label: 'Confirm Password', placeholder: 'Confirm password', type: 'password' },
        ].map(({ name, label, placeholder, type = 'text' }) => (
          <div key={name}>
            <label className="block text-sm font-medium text-gray-500 mb-1.5">{label}</label>
            <input
              type={type}
              name={name}
              value={(formData as any)[name]}
              onChange={handleChange}
              required
              className="input-field"
              placeholder={placeholder}
            />
          </div>
        ))}

        <button type="submit" disabled={loading} className="btn-primary w-full py-3">
          {loading ? 'Creating account...' : 'Create Account'}
        </button>
      </form>

      <p className="text-center text-gray-400 text-sm mt-6">
        Already have an account?{' '}
        <Link to="/login" className="text-accent-dark font-medium hover:underline">Sign in</Link>
      </p>
    </AuthLayout>
  );
}
