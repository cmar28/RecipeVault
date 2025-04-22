import { useLocation } from "wouter";

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
        className={`flex flex-col items-center justify-center w-full h-full ${activeItem === "recipes" ? "text-primary" : "text-neutral-300"}`}
        onClick={handleViewList}
      >
        <span className="material-icons">list</span>
        <span className="text-xs mt-1">Recipes</span>
      </button>
      
      <button 
        className={`flex flex-col items-center justify-center w-full h-full ${activeItem === "add" ? "text-primary" : "text-neutral-300"}`}
        onClick={onAddNew}
      >
        <span className="material-icons">add_circle</span>
        <span className="text-xs mt-1">Add New</span>
      </button>
      
      <button 
        className={`flex flex-col items-center justify-center w-full h-full ${activeItem === "favorites" ? "text-primary" : "text-neutral-300"}`}
        onClick={handleViewFavorites}
      >
        <span className="material-icons">favorite</span>
        <span className="text-xs mt-1">Favorites</span>
      </button>
    </nav>
  );
};

export default BottomNavigation;
