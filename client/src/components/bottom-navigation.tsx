import { useLocation } from "wouter";
import { List, PlusCircle, Heart } from "lucide-react";

type BottomNavigationProps = {
  activeItem: "recipes" | "add" | "favorites";
  onAddNew: () => void;
};

const BottomNavigation = ({ activeItem, onAddNew }: BottomNavigationProps) => {
  const [, setLocation] = useLocation();
  
  const handleViewList = () => {
    setLocation("/");
  };

  const handleViewFavorites = () => {
    // For future implementation
    alert("Favorites feature coming soon!");
  };

  return (
    <nav className="bg-white shadow-md fixed bottom-0 left-0 right-0 h-16 flex justify-around items-center z-10">
      <button 
        className={`flex flex-col items-center justify-center w-full h-full ${activeItem === "recipes" ? "text-primary font-medium" : "text-neutral-500"}`}
        onClick={handleViewList}
      >
        <List className={`h-5 w-5 ${activeItem === "recipes" ? "text-primary" : "text-neutral-500"}`} />
        <span className="text-xs mt-1">Recipes</span>
      </button>
      
      <button 
        className={`flex flex-col items-center justify-center w-full h-full ${activeItem === "add" ? "text-primary font-medium" : "text-neutral-500"}`}
        onClick={onAddNew}
      >
        <PlusCircle className={`h-5 w-5 ${activeItem === "add" ? "text-primary" : "text-neutral-500"}`} />
        <span className="text-xs mt-1">Add New</span>
      </button>
      
      <button 
        className={`flex flex-col items-center justify-center w-full h-full ${activeItem === "favorites" ? "text-primary font-medium" : "text-neutral-500"}`}
        onClick={handleViewFavorites}
      >
        <Heart className={`h-5 w-5 ${activeItem === "favorites" ? "text-primary" : "text-neutral-500"}`} />
        <span className="text-xs mt-1">Favorites</span>
      </button>
    </nav>
  );
};

export default BottomNavigation;
