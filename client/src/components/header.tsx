import { useState, useEffect } from "react";
import { Search, ChefHat, X, LogOut, User } from "lucide-react";
import { useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";

type HeaderProps = {
  title: string;
  searchQuery: string;
  onSearch: (query: string) => void;
};

const Header = ({ title, searchQuery, onSearch }: HeaderProps) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [, setLocation] = useLocation();
  const { currentUser, loading, logOut } = useAuth();

  // Track scroll position for header styling
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleHomeClick = () => {
    setLocation('/');
  };

  const handleLogin = () => {
    setLocation('/login');
  };

  // Get user initials for avatar fallback
  const getUserInitials = () => {
    if (!currentUser?.displayName) return "U";
    return currentUser.displayName
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  return (
    <header 
      className={`fixed top-0 left-0 right-0 z-20 transition-all duration-300 ${
        isScrolled ? 'bg-white/95 backdrop-blur-sm shadow-md' : 'bg-white shadow-sm'
      }`}
    >
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo/Title Area */}
        <div 
          className="flex items-center space-x-2 cursor-pointer" 
          onClick={handleHomeClick}
        >
          <div className="bg-primary text-white p-1.5 rounded-lg">
            <ChefHat className="h-5 w-5" />
          </div>
          {!isSearchFocused && (
            <>
              <h1 className="text-xl font-bold text-primary hidden sm:block">{title}</h1>
              <h1 className="text-xl font-bold bg-gradient-to-r from-primary to-red-500 text-transparent bg-clip-text sm:hidden">
                RK
              </h1>
            </>
          )}
        </div>
        
        {/* Right Side: Search & Auth */}
        <div className="flex items-center gap-2">
          {/* Search Area - Now aligned right */}
          <div 
            className={`relative transition-all duration-300 ${
              isSearchFocused ? 'flex-1 w-60 sm:w-72' : 'w-auto'
            }`}
          >
            <div className="relative flex items-center">
              {!isSearchFocused && (
                <Search 
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-primary h-4 w-4" 
                />
              )}
              
              <input 
                type="text" 
                className={`transition-all duration-300 text-sm focus:outline-none border focus:ring-2 focus:ring-primary focus:ring-opacity-40 ${
                  isSearchFocused 
                    ? 'w-full pl-4 pr-10 py-2.5 rounded-xl border-primary'
                    : 'pl-10 pr-4 py-2 rounded-full bg-secondary border-transparent'
                }`}
                placeholder={isSearchFocused ? "Search by recipe name or description..." : "Search recipes"}
                value={searchQuery}
                onChange={(e) => onSearch(e.target.value)}
                onFocus={() => setIsSearchFocused(true)}
                onBlur={() => setTimeout(() => setIsSearchFocused(false), 200)}
              />
              
              {isSearchFocused && searchQuery && (
                <button
                  className="absolute right-3 top-1/2 transform -translate-y-1/2"
                  onClick={() => onSearch('')}
                >
                  <X className="h-4 w-4 text-muted-foreground hover:text-primary" />
                </button>
              )}
            </div>
          </div>

          {/* Auth - Smaller user icon */}
          {!isSearchFocused && (
            <div className="flex items-center ml-1">
              {loading ? (
                <div className="h-6 w-6 rounded-full bg-secondary animate-pulse"></div>
              ) : currentUser ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-7 w-7 rounded-full p-0">
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={currentUser.photoURL || undefined} alt={currentUser.displayName || 'User'} />
                        <AvatarFallback className="text-xs">{getUserInitials()}</AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel className="text-sm font-normal">
                      <div className="flex flex-col">
                        <span className="font-medium">{currentUser.displayName || 'User'}</span>
                        <span className="text-xs text-muted-foreground truncate">{currentUser.email}</span>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={logOut} className="text-red-600">
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Log out</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Button 
                  onClick={handleLogin} 
                  variant="ghost" 
                  size="sm"
                  className="text-primary hover:text-primary-focus py-1 h-7"
                >
                  <User className="h-3.5 w-3.5 mr-1" />
                  <span className="text-xs">Sign In</span>
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
