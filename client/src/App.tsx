import { Switch, Route } from "wouter";
import { useEffect } from "react";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { connectToWebSocket } from "@/utils/websocket-service";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import RecipeDetail from "@/pages/recipe-detail";
import RecipeForm from "@/pages/recipe-form";
import Favorites from "@/pages/favorites";
import Login from "@/pages/login";

function Router() {
  return (
    <Switch>
      {/* Public Routes */}
      <Route path="/login" component={Login} />
      
      {/* Protected Routes */}
      <ProtectedRoute path="/" component={Home} />
      <ProtectedRoute path="/recipes/:id" component={RecipeDetail} />
      <ProtectedRoute path="/create" component={() => <RecipeForm mode="create" />} />
      <ProtectedRoute path="/edit/:id" component={({params}) => {
        console.log("Edit route params:", params);
        const id = parseInt(params.id);
        console.log("Parsed ID:", id);
        return <RecipeForm mode="edit" id={id} />;
      }} />
      <ProtectedRoute path="/favorites" component={Favorites} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  // Connect to WebSocket on app load
  useEffect(() => {
    // Try to establish the WebSocket connection when the app loads
    connectToWebSocket()
      .then(clientId => console.log('WebSocket connected with client ID:', clientId))
      .catch(err => console.warn('WebSocket connection failed, real-time updates will not be available:', err));
  }, []);
  
  return (
    <ThemeProvider defaultTheme="light">
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <TooltipProvider>
            <Toaster />
            <Router />
          </TooltipProvider>
        </AuthProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;
