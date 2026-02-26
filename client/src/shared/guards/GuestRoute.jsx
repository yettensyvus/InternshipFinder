import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { getDashboardPathForRole } from '../../utils/rolePaths';

export default function GuestRoute({ children }) {
  const { auth } = useAuth();
  const location = useLocation();

  if (auth?.token) {
    const to = getDashboardPathForRole(auth.role) || '/';
    return <Navigate to={to} replace state={{ from: location }} />;
  }

  return children;
}
