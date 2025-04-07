
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Bell, AlertCircle, User, LogOut } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from '@/context/AuthContext';

const Header = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="header-gradient text-white py-4 px-6">
      <div className="container mx-auto flex flex-col items-center justify-between md:flex-row">
        <div className="w-full flex justify-center md:w-auto md:justify-start mb-4 md:mb-0">
          <motion.img 
            src="/lovable-uploads/531f50f5-6b5c-4c4d-a4ad-b66888cbc80b.png" 
            alt="Protostar Nova Logo" 
            className="h-12 w-12"
            animate={{ rotate: 360 }}
            transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
          />
        </div>
        
        <h1 className="text-xl font-bold mb-4 md:mb-0">Protostar Nova</h1>
        
        <div className="flex items-center space-x-6">
          <nav className="hidden md:flex space-x-6">
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
            
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="rounded-full bg-purple-600 text-white hover:bg-purple-700">
                    <span>{user.email.charAt(0).toUpperCase()}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>
                    <div className="flex flex-col">
                      <span>{user.email}</span>
                      <span className="text-xs text-muted-foreground capitalize">{user.role}</span>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>Profile</DropdownMenuItem>
                  <DropdownMenuItem>Settings</DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout}>
                    <LogOut className="h-4 w-4 mr-2" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button variant="outline" size="sm" className="text-white border-white hover:bg-white/10" onClick={() => navigate('/login')}>
                Login
              </Button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
