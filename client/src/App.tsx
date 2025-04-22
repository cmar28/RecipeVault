import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import RecipeDetail from "@/pages/recipe-detail";
import RecipeForm from "@/pages/recipe-form";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/recipes/:id" component={RecipeDetail} />
      <Route path="/create" component={() => <RecipeForm mode="create" />} />
      <Route path="/edit/:id" component={(params) => <RecipeForm mode="edit" id={parseInt(params.id)} />} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
