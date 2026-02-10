import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { getDashboardPathForRole } from '../utils/rolePaths';

export default function RoleBasedRedirect() {
  const { auth } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!auth?.token || !auth?.role) return;

    navigate(getDashboardPathForRole(auth.role), { replace: true });
  }, [auth, navigate]);

  return null;
}
