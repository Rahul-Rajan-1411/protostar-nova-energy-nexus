
import React from 'react';
import { Link } from 'react-router-dom';
import { Bell, AlertCircle, User } from 'lucide-react';
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const Header = () => {
  return (
    <header className="header-gradient text-white py-4 px-6 flex items-center justify-between">
      <div className="flex items-center space-x-2">
        <img 
          src="/lovable-uploads/531f50f5-6b5c-4c4d-a4ad-b66888cbc80b.png" 
          alt="Logo" 
          className="h-8 w-8"
        />
        <h1 className="text-xl font-bold">Protostar Nova</h1>
      </div>
      
      <div className="flex items-center space-x-6">
        <nav className="flex space-x-6">
          <Link to="/" className="font-medium hover:text-gray-200 transition-colors">Home</Link>
          <Link to="/projects" className="font-medium hover:text-gray-200 transition-colors">Projects</Link>
          <Link to="/settings" className="font-medium hover:text-gray-200 transition-colors">Settings</Link>
        </nav>
        
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="icon" className="text-white hover:bg-white/10">
            <AlertCircle className="h-5 w-5" />
          </Button>
          
          <Button variant="ghost" size="icon" className="text-white hover:bg-white/10">
            <Bell className="h-5 w-5" />
          </Button>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-full bg-purple-600 text-white hover:bg-purple-700">
                <span>A</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>Profile</DropdownMenuItem>
              <DropdownMenuItem>Settings</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>Logout</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
};

export default Header;
