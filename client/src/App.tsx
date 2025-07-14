import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { BottomNavigation } from "@/components/ui/bottom-navigation";
import { useLocation } from "wouter";
import { useState, useEffect } from "react";
import { getCurrentUser, createAnonymousUser } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";

// Pages
import Home from "@/pages/home";
import Scanner from "@/pages/scanner";
import ProductDetail from "@/pages/product-detail";
import IngredientDetail from "@/pages/ingredient-detail";
import Bookmarks from "@/pages/bookmarks";
import Profile from "@/pages/profile";
import NotFound from "@/pages/not-found";

function Router() {
  const [location, setLocation] = useLocation();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const initAuth = async () => {
      try {
        let user = await getCurrentUser();
        if (!user) {
          user = await createAnonymousUser();
        }
        setCurrentUser(user);
      } catch (error) {
        console.error('Failed to initialize user:', error);
        try {
          const user = await createAnonymousUser();
          setCurrentUser(user);
        } catch (createError) {
          console.error('Failed to create anonymous user:', createError);
          setCurrentUser(null);
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const handleUserChange = (user: any) => {
    setCurrentUser(user);
  };

  const handleNavigate = (path: string) => {
    setLocation(path);
  };

  // Don't show bottom navigation on scanner page
  const showBottomNav = !location.startsWith("/scanner");

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto bg-white min-h-screen shadow-lg relative">
      <Switch>
        <Route path="/" component={() => <Home currentUser={currentUser} />} />
        <Route path="/scanner" component={Scanner} />
        <Route path="/product/:id" component={ProductDetail} />
        <Route path="/product/barcode/:barcode" component={ProductDetail} />
        <Route path="/ingredient/:id" component={() => <IngredientDetail currentUser={currentUser} />} />
        <Route path="/ingredient/name/:name" component={() => <IngredientDetail currentUser={currentUser} />} />
        <Route path="/bookmarks" component={() => <Bookmarks currentUser={currentUser} />} />
        <Route path="/profile" component={() => <Profile currentUser={currentUser} onUserChange={handleUserChange} />} />
        <Route component={NotFound} />
      </Switch>
      
      {showBottomNav && (
        <BottomNavigation onNavigate={handleNavigate} />
      )}
    </div>
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
