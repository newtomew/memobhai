import { useState } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '../store/auth';
import { authAPI } from '../services/api';
import AuthLayout from '../components/AuthLayout';
import clsx from 'clsx';

type SignupType = 'new_org' | 'join_manager' | 'join_employee';

export default function RegisterPage() {
  const [signupType, setSignupType] = useState<SignupType>('new_org');
  const [formData, setFormData] = useState({
    organizationName: '',
    organizationSlug: '',
    orgSlug: '',
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [orgPreview, setOrgPreview] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const selectedPlan = searchParams.get('plan');
  const { setAuth } = useAuthStore();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const lookupOrg = async () => {
    if (!formData.orgSlug.trim()) return;
    try {
      const res = await authAPI.lookupOrg(formData.orgSlug.trim());
      setOrgPreview(res.data.organization.name);
      setError('');
    } catch {
      setOrgPreview('');
      setError('Organization not found');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    setLoading(true);
    try {
      const payload: Parameters<typeof authAPI.register>[0] = {
        signupType,
        name: formData.name,
        email: formData.email,
        password: formData.password,
      };

      if (signupType === 'new_org') {
        payload.organizationName = formData.organizationName;
        payload.organizationSlug = formData.organizationSlug;
      } else {
        payload.orgSlug = formData.orgSlug;
      }

      const response = await authAPI.register(payload);
      const { token, user, organization, pending } = response.data;

      if (token && user && organization) {
        setAuth(token, user, organization);
      }

      if (pending || user?.status === 'pending' || organization?.status === 'pending') {
        navigate(selectedPlan === 'professional' ? '/upgrade' : '/pending');
      } else if (selectedPlan === 'professional') {
        navigate('/upgrade');
      } else {
        navigate('/dashboard');
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const tabs: { id: SignupType; label: string; desc: string }[] = [
    { id: 'new_org', label: 'New Organization', desc: 'Register your company on MemoBhai' },
    { id: 'join_manager', label: 'Join as Manager', desc: 'Requires platform admin approval' },
    { id: 'join_employee', label: 'Join as Employee', desc: 'Requires org manager approval' },
  ];

  return (
    <AuthLayout title="Join MemoBhai" subtitle={tabs.find((t) => t.id === signupType)?.desc}>
      <div className="flex gap-1 mb-5 p-1 bg-surface-muted rounded-2xl">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => { setSignupType(t.id); setError(''); }}
            className={clsx(
              'flex-1 py-2 px-2 text-xs font-medium rounded-xl transition',
              signupType === t.id ? 'bg-white text-charcoal shadow-sm' : 'text-gray-400',
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {selectedPlan === 'professional' && (
        <div className="bg-accent/10 text-accent-dark text-sm px-4 py-3 rounded-2xl mb-4">
          You selected the Professional plan (৳2,999/month). After registration you will complete payment via aamarPay.
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="bg-red-50 text-red-500 px-4 py-3 rounded-2xl text-sm">{error}</div>
        )}

        {signupType === 'new_org' && (
          <>
            <Field name="organizationName" label="Organization Name" placeholder="Acme Corporation" value={formData.organizationName} onChange={handleChange} />
            <Field name="organizationSlug" label="Organization Slug" placeholder="acme-corp" value={formData.organizationSlug} onChange={handleChange} />
          </>
        )}

        {(signupType === 'join_manager' || signupType === 'join_employee') && (
          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1.5">Organization Slug</label>
            <div className="flex gap-2">
              <input
                name="orgSlug"
                value={formData.orgSlug}
                onChange={handleChange}
                required
                className="input-field flex-1"
                placeholder="acme-corp"
              />
              <button type="button" onClick={lookupOrg} className="btn-secondary px-4 text-sm">
                Verify
              </button>
            </div>
            {orgPreview && (
              <p className="text-emerald-600 text-xs mt-1">Found: {orgPreview}</p>
            )}
          </div>
        )}

        <Field name="name" label="Full Name" placeholder="John Doe" value={formData.name} onChange={handleChange} />
        <Field name="email" label="Email" placeholder="you@example.com" type="email" value={formData.email} onChange={handleChange} />
        <Field name="password" label="Password" placeholder="At least 8 characters" type="password" value={formData.password} onChange={handleChange} />
        <Field name="confirmPassword" label="Confirm Password" placeholder="Confirm password" type="password" value={formData.confirmPassword} onChange={handleChange} />

        <button type="submit" disabled={loading} className="btn-primary w-full py-3">
          {loading ? 'Submitting...' : 'Submit Registration'}
        </button>
      </form>

      <p className="text-center text-gray-400 text-sm mt-6">
        Already have an account?{' '}
        <Link
          to={selectedPlan === 'professional' ? '/login?redirect=/upgrade' : '/login'}
          className="text-accent-dark font-medium hover:underline"
        >
          Sign in
        </Link>
      </p>
    </AuthLayout>
  );
}

function Field({
  name, label, placeholder, type = 'text', value, onChange,
}: {
  name: string; label: string; placeholder: string; type?: string;
  value: string; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-500 mb-1.5">{label}</label>
      <input type={type} name={name} value={value} onChange={onChange} required className="input-field" placeholder={placeholder} />
    </div>
  );
}
