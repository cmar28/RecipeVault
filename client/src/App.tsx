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
      <Route path="/edit/:id" component={(props) => {
        console.log("Edit route params:", props);
        const id = parseInt(props.params.id);
        console.log("Parsed ID:", id);
        return <RecipeForm mode="edit" id={id} />;
      }} />
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
