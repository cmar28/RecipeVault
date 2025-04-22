import { useState } from "react";

type HeaderProps = {
  title: string;
  searchQuery: string;
  onSearch: (query: string) => void;
};

const Header = ({ title, searchQuery, onSearch }: HeaderProps) => {
  return (
    <header className="bg-white shadow-sm fixed top-0 left-0 right-0 z-10">
      <div className="container mx-auto px-4 h-14 flex items-center justify-between">
        <h1 className="text-xl font-medium text-primary">{title}</h1>
        <div className="relative">
          <span className="material-icons absolute left-2 top-1/2 transform -translate-y-1/2 text-neutral-300">search</span>
          <input 
            type="text" 
            className="pl-10 pr-4 py-2 rounded-full bg-neutral-100 text-sm outline-none focus:ring-2 focus:ring-primary focus:ring-opacity-50"
            placeholder="Search recipes"
            value={searchQuery}
            onChange={(e) => onSearch(e.target.value)}
          />
        </div>
      </div>
    </header>
  );
};

export default Header;
