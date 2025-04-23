import { useEffect } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { FaGoogle } from 'react-icons/fa';
import { ChefHat, Utensils, Heart, Clock, ListChecks } from 'lucide-react';

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
    <div className="min-h-screen p-4 flex items-center justify-center bg-gradient-to-b from-orange-50 to-amber-50">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-6xl w-full">
        {/* Left Column: Login Form */}
        <div className="flex items-center justify-center">
          <Card className="w-full max-w-md shadow-lg border-0">
            <CardHeader className="text-center pb-2">
              <div className="flex justify-center mb-4">
                <div className="bg-primary text-white p-4 rounded-xl shadow-md">
                  <ChefHat className="h-10 w-10" />
                </div>
              </div>
              <CardTitle className="text-3xl font-bold bg-gradient-to-r from-primary to-orange-600 text-transparent bg-clip-text mb-1">Recipe Keeper</CardTitle>
              <CardDescription className="text-base">Sign in to manage your recipe collection</CardDescription>
            </CardHeader>
            <CardContent className="space-y-8 pt-4">
              <div className="text-center">
                <Button 
                  className="w-full flex items-center justify-center gap-2 py-6 text-base font-medium rounded-xl bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 shadow-sm transition-all hover:shadow" 
                  onClick={signInWithGoogle}
                >
                  <FaGoogle className="text-[#4285F4] h-5 w-5" />
                  <span>Continue with Google</span>
                </Button>
              </div>
              <div className="flex justify-center space-x-8 py-2">
                <div className="flex flex-col items-center">
                  <div className="rounded-full bg-amber-100 p-2 mb-2">
                    <Utensils className="h-5 w-5 text-primary" />
                  </div>
                  <span className="text-xs text-muted-foreground">Save Recipes</span>
                </div>
                <div className="flex flex-col items-center">
                  <div className="rounded-full bg-amber-100 p-2 mb-2">
                    <Heart className="h-5 w-5 text-primary" />
                  </div>
                  <span className="text-xs text-muted-foreground">Add Favorites</span>
                </div>
                <div className="flex flex-col items-center">
                  <div className="rounded-full bg-amber-100 p-2 mb-2">
                    <Clock className="h-5 w-5 text-primary" />
                  </div>
                  <span className="text-xs text-muted-foreground">Track Times</span>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-center text-xs text-muted-foreground">
              <p>By signing in, you agree to our terms and conditions.</p>
            </CardFooter>
          </Card>
        </div>

        {/* Right Column: Hero Content */}
        <div className="hidden lg:flex flex-col justify-center px-4">
          <div className="space-y-6">
            <h1 className="text-4xl font-bold tracking-tight text-primary">
              Your Recipe Collection, <br/>
              <span className="bg-gradient-to-r from-primary to-orange-600 text-transparent bg-clip-text">All in One Place</span>
            </h1>
            <p className="text-lg text-muted-foreground leading-relaxed">
              Store your favorite recipes, organize meal plans, and access your collection from anywhere with our easy-to-use recipe management app.
            </p>
            <div className="space-y-4 mt-6">
              <div className="flex items-start gap-3">
                <div className="bg-amber-100 p-2 rounded-lg mt-1">
                  <ListChecks className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-medium">Organize Your Recipes</h3>
                  <p className="text-muted-foreground text-sm">Save recipes with photos and detailed instructions</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="bg-amber-100 p-2 rounded-lg mt-1">
                  <Heart className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-medium">Mark Your Favorites</h3>
                  <p className="text-muted-foreground text-sm">Keep your best-loved recipes just a tap away</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="bg-amber-100 p-2 rounded-lg mt-1">
                  <Utensils className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-medium">User-Friendly Interface</h3>
                  <p className="text-muted-foreground text-sm">Enjoy a seamless mobile experience</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;