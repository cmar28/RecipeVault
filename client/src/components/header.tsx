import { useState, useEffect } from "react";
import { Search, ChefHat, X } from "lucide-react";
import { useLocation } from "wouter";

type HeaderProps = {
  title: string;
  searchQuery: string;
  onSearch: (query: string) => void;
};

const Header = ({ title, searchQuery, onSearch }: HeaderProps) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [, setLocation] = useLocation();

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
        
        {/* Search Area - Expands on mobile when focused */}
        <div 
          className={`relative transition-all duration-300 ${
            isSearchFocused ? 'w-full mx-2' : 'w-auto'
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
      </div>
    </header>
  );
};

export default Header;
