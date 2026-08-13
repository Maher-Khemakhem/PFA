import { Navigate } from 'react-router-dom';
import { useAuth } from '@/lib/auth-context';

export default function DashboardPage() {
  const { userRole } = useAuth();

  if (userRole === 'admin') return <Navigate to="/dashboard/admin" replace />;
  if (userRole === 'organization') return <Navigate to="/dashboard/organization" replace />;
  return <Navigate to="/dashboard/student" replace />;
}
