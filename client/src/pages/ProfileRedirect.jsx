import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { getProfilePathForRole } from '../utils/rolePaths';

export default function ProfileRedirect() {
  const { auth } = useAuth();
  const location = useLocation();

  if (!auth?.token) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <Navigate to={getProfilePathForRole(auth.role)} replace />;
}
