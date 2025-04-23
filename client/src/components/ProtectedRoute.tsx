import { useAuth } from '@/contexts/AuthContext';
import { useLocation, Route } from 'wouter';
import { Loader2 } from 'lucide-react';

type ProtectedRouteProps = {
  path: string;
  component: React.ComponentType;
};

export const ProtectedRoute = ({ path, component: Component }: ProtectedRouteProps) => {
  const { currentUser, loading } = useAuth();
  const [, setLocation] = useLocation();

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

  // If user is not authenticated, redirect to login page
  if (!currentUser) {
    return (
      <Route path={path}>
        {() => {
          setLocation('/login');
          return null;
        }}
      </Route>
    );
  }

  // If user is authenticated, render the protected component
  return <Route path={path} component={Component} />;
};