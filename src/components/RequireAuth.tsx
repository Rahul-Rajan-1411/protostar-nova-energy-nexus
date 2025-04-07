import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';

interface RequireAuthProps {
  children: React.ReactNode;
  allowedRoles?: string[];
}

const RequireAuth = ({ children, allowedRoles }: RequireAuthProps) => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        // Redirect to login if not authenticated
        navigate('/login', { state: { from: location } });
      } else if (allowedRoles && !allowedRoles.includes(user.role)) {
        // Redirect to unauthorized page if user doesn't have the required role
        navigate('/unauthorized');
      }
    }
  }, [user, loading, navigate, location, allowedRoles]);

  // Show nothing while checking auth
  if (loading || !user) {
    return null;
  }

  // If role check is needed and user doesn't have the role, show nothing
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return null;
  }

  // Otherwise, render children
  return <>{children}</>;
};

export default RequireAuth;
