import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../store/auth';
import PendingApprovalPage from '../pages/PendingApprovalPage';

export default function PendingRoute() {
  const { isLoggedIn, isPending } = useAuthStore();

  if (!isLoggedIn()) return <Navigate to="/login" replace />;
  if (!isPending()) return <Navigate to="/dashboard" replace />;

  return <PendingApprovalPage />;
}
