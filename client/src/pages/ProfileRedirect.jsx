import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export default function ProfileRedirect() {
  const { auth } = useAuth();
  const location = useLocation();

  if (!auth?.token) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (auth.role === 'STUDENT') return <Navigate to="/student/profile" replace />;
  if (auth.role === 'RECRUITER') return <Navigate to="/recruiter/profile" replace />;
  if (auth.role === 'ADMIN') return <Navigate to="/admin/profile" replace />;

  return <Navigate to="/" replace />;
}
