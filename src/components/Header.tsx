
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Home, BarChart2, Settings, SunMedium, LogOut } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useIsMobile } from '@/hooks/use-mobile';

const Header = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const isMobile = useIsMobile();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white">
      <div className="flex h-16 items-center justify-between px-4 md:px-6">
        <div className="flex items-center">
          <div className="text-2xl font-bold text-green-600 mr-2">
            Protostar Nova
          </div>
        </div>

        <div className="flex justify-center absolute left-0 right-0 mx-auto w-40 pointer-events-none">
          <img 
            src="/lovable-uploads/531f50f5-6b5c-4c4d-a4ad-b66888cbc80b.png" 
            alt="Logo" 
            className="h-12" 
          />
        </div>

        <div className="flex items-center space-x-1 md:space-x-2">
          {user ? (
            <>
              {!isMobile && (
                <>
                  <Link to="/">
                    <Button variant="ghost" size="sm" className="text-gray-700 hover:text-green-600">
                      <Home className="h-5 w-5 mr-1" />
                      Dashboard
                    </Button>
                  </Link>
                  <Link to="/projects">
                    <Button variant="ghost" size="sm" className="text-gray-700 hover:text-green-600">
                      <SunMedium className="h-5 w-5 mr-1" />
                      Projects
                    </Button>
                  </Link>
                  <Link to="/analytics">
                    <Button variant="ghost" size="sm" className="text-gray-700 hover:text-green-600">
                      <BarChart2 className="h-5 w-5 mr-1" />
                      Analytics
                    </Button>
                  </Link>
                  <Link to="/settings">
                    <Button variant="ghost" size="sm" className="text-gray-700 hover:text-green-600">
                      <Settings className="h-5 w-5 mr-1" />
                      Settings
                    </Button>
                  </Link>
                </>
              )}
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleLogout}
                className="text-gray-700 hover:text-red-600"
              >
                <LogOut className="h-5 w-5" />
                {!isMobile && <span className="ml-1">Logout</span>}
              </Button>
            </>
          ) : (
            <Link to="/login">
              <Button variant="default" size="sm">
                Login
              </Button>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
