import { useLocation } from "wouter";
import { Home, Plus, Heart, Menu } from "lucide-react";
import { useState, useEffect } from "react";

type BottomNavigationProps = {
  activeItem: "recipes" | "add" | "favorites";
  onAddNew: () => void;
};

const BottomNavigation = ({ activeItem, onAddNew }: BottomNavigationProps) => {
  const [, setLocation] = useLocation();
  const [showMenu, setShowMenu] = useState(false);
  
  // Handle navigation animation
  const [indicatorStyle, setIndicatorStyle] = useState({
    left: '16.6%',
    width: '16.6%'
  });
  
  useEffect(() => {
    // Set indicator width based on active item
    // Position is controlled by CSS (centered with left: 50%, transform: translateX(-50%))
    if (activeItem === 'recipes') {
      setIndicatorStyle({ left: '50%', width: '3rem' });
    } else if (activeItem === 'favorites') {
      setIndicatorStyle({ left: '50%', width: '3rem' });
    } else {
      setIndicatorStyle({ left: '50%', width: '0' });
    }
  }, [activeItem]);

  const handleViewHome = () => {
    setLocation("/");
  };

  const handleViewFavorites = () => {
    // For future implementation - can be updated to navigate to favorites page
    const favoriteRecipes = document.querySelectorAll('[data-isfavorite="true"]');
    if (favoriteRecipes.length > 0) {
      setLocation('/favorites');
    } else {
      alert("You haven't added any favorites yet!");
    }
  };
  
  const handleAddClick = () => {
    // Add animation effect before triggering the add action
    const button = document.querySelector('.add-button');
    if (button) {
      button.classList.add('animate-pulse');
      setTimeout(() => {
        button.classList.remove('animate-pulse');
        onAddNew();
      }, 150);
    } else {
      onAddNew();
    }
  };

  return (
    <nav className="bg-white shadow-lg fixed bottom-0 left-0 right-0 h-16 flex justify-around items-center z-30 border-t border-border">
      {/* Background indicator for active item */}
      <div 
        className="nav-indicator"
        style={{
          width: indicatorStyle.width,
        }}
      />
      
      {/* Home Button */}
      <button 
        className={`flex flex-col items-center justify-center w-full h-full relative transition-colors duration-200 ${
          activeItem === "recipes" ? "text-primary font-medium" : "text-muted-foreground"
        }`}
        onClick={handleViewHome}
      >
        <Home 
          className={`h-5 w-5 transition-all duration-200 ${
            activeItem === "recipes" ? "text-primary scale-110" : "text-muted-foreground"
          }`} 
        />
        <span className="text-xs mt-1">Home</span>
      </button>
      
      {/* Add New Button - Center circular button */}
      <div className="relative w-full flex justify-center">
        <button 
          className="add-button absolute -top-8 bg-primary text-white w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-transform duration-200 hover:scale-105 active:scale-95"
          onClick={handleAddClick}
          aria-label="Add new recipe"
        >
          <Plus className="h-8 w-8" />
        </button>
        
        {/* Placeholder to maintain layout */}
        <div className="h-full w-full invisible">
          <span className="text-xs mt-1">Add</span>
        </div>
      </div>
      
      {/* Favorites Button */}
      <button 
        className={`flex flex-col items-center justify-center w-full h-full relative transition-colors duration-200 ${
          activeItem === "favorites" ? "text-primary font-medium" : "text-muted-foreground"
        }`}
        onClick={handleViewFavorites}
      >
        <Heart 
          className={`h-5 w-5 transition-all duration-200 ${
            activeItem === "favorites" 
              ? "text-primary fill-primary scale-110" 
              : "text-muted-foreground"
          }`} 
        />
        <span className="text-xs mt-1">Favorites</span>
      </button>
    </nav>
  );
};

export default BottomNavigation;
