import { useAuth } from '@/contexts/AuthContext';
import { useLocation, Route } from 'wouter';
import { Loader2 } from 'lucide-react';
import { useEffect } from 'react';

type ProtectedRouteProps = {
  path: string;
  component: React.ComponentType<any>;
};

export const ProtectedRoute = ({ path, component: Component }: ProtectedRouteProps) => {
  const { currentUser, loading } = useAuth();
  const [location, setLocation] = useLocation();

  useEffect(() => {
    // After rendering, if user is not logged in and auth is done loading, redirect
    if (!loading && !currentUser) {
      setLocation('/login');
    }
  }, [currentUser, loading, setLocation]);

  // If auth is still loading, show a loading spinner
  if (loading) {
    return (
      <Route path={path}>
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Route>
    );
  }

  // If user is not authenticated, show loading (redirect will happen via useEffect)
  if (!currentUser) {
    return (
      <Route path={path}>
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Route>
    );
  }

  // If user is authenticated, render the protected component
  return (
    <Route path={path}>
      {(params) => <Component {...params} />}
    </Route>
  );
};