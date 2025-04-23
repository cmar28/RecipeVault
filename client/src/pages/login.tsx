import { useEffect } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { FaGoogle } from 'react-icons/fa';

const Login = () => {
  const { currentUser, loading, signInWithGoogle } = useAuth();
  const [, setLocation] = useLocation();

  // Redirect to home if user is already logged in
  useEffect(() => {
    if (currentUser && !loading) {
      setLocation('/');
    }
  }, [currentUser, loading, setLocation]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-pulse text-center">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 flex items-center justify-center bg-gradient-to-r from-orange-50 to-amber-50">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-6xl w-full">
        {/* Left Column: Login Form */}
        <div className="flex items-center justify-center">
          <Card className="w-full max-w-md shadow-lg border-0">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl font-bold">Welcome to Recipe Keeper</CardTitle>
              <CardDescription>Sign in to save your favorite recipes</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="text-center">
                <Button 
                  className="w-full flex items-center justify-center gap-2 bg-white hover:bg-slate-100 text-slate-800 border border-slate-300" 
                  onClick={signInWithGoogle}
                >
                  <FaGoogle className="text-[#4285F4]" />
                  <span>Sign in with Google</span>
                </Button>
              </div>
            </CardContent>
            <CardFooter className="flex justify-center text-sm text-muted-foreground">
              <p>By signing in, you agree to our terms and conditions.</p>
            </CardFooter>
          </Card>
        </div>

        {/* Right Column: Hero Content */}
        <div className="hidden lg:flex flex-col justify-center">
          <div className="space-y-4">
            <h1 className="text-4xl font-bold tracking-tight text-primary">
              Your Recipe Collection, <br/>
              All in One Place
            </h1>
            <p className="text-lg text-muted-foreground">
              Store your favorite recipes, organize meal plans, and access your collection from anywhere.
            </p>
            <ul className="space-y-2">
              <li className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-primary"></div>
                <span>Save recipes with photos and detailed instructions</span>
              </li>
              <li className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-primary"></div>
                <span>Mark favorites for quick access</span>
              </li>
              <li className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-primary"></div>
                <span>User-friendly mobile experience</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;