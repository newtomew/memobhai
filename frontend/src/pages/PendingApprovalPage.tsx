import { useAuthStore } from '../store/auth';
import { Clock, CreditCard } from 'lucide-react';
import { Link } from 'react-router-dom';
import AuthLayout from '../components/AuthLayout';

export default function PendingApprovalPage() {
  const { user, organization, clearAuth, isOrgAdmin } = useAuthStore();

  return (
    <AuthLayout title="Awaiting Approval" subtitle="Your account is pending review">
      <div className="text-center space-y-4">
        <div className="w-16 h-16 bg-amber-50 rounded-3xl flex items-center justify-center mx-auto">
          <Clock size={28} className="text-amber-500" />
        </div>
        <p className="text-gray-500 text-sm leading-relaxed">
          Hi <strong className="text-charcoal">{user?.name}</strong>, your registration for{' '}
          <strong className="text-charcoal">{organization?.name}</strong> is pending approval.
        </p>
        {organization?.status === 'pending' ? (
          <p className="text-gray-400 text-xs">
            New organizations are reviewed by MemoBhai platform administrators before activation.
          </p>
        ) : user?.role === 'admin' ? (
          <p className="text-gray-400 text-xs">
            Manager accounts require approval from a MemoBhai platform administrator.
          </p>
        ) : (
          <p className="text-gray-400 text-xs">
            Employee accounts require approval from your organization manager.
          </p>
        )}
        {isOrgAdmin() && (
          <Link to="/upgrade" className="btn-primary w-full mt-2 inline-flex items-center justify-center gap-2">
            <CreditCard size={18} />
            Pay for Professional (৳2,999)
          </Link>
        )}
        <button
          onClick={() => { clearAuth(); window.location.href = '/login'; }}
          className="btn-primary w-full mt-4"
        >
          Sign out
        </button>
      </div>
    </AuthLayout>
  );
}
