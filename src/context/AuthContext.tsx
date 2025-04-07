
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';

type AppRole = 'super_admin' | 'admin' | 'client_admin' | 'client';

interface User {
  id: string;
  email: string;
  role: AppRole;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for logged in user in session storage
    const storedUser = sessionStorage.getItem('protostar_user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (error) {
        console.error('Failed to parse stored user:', error);
        sessionStorage.removeItem('protostar_user');
      }
    }
    setLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    try {
      setLoading(true);
      
      // In a real app with Supabase Auth, we'd use supabase.auth.signInWithPassword
      // For our custom table setup, we'll query the users table directly
      const { data, error } = await supabase
        .from('users')
        .select('id, email, role')
        .eq('email', email)
        .single();
        
      if (error || !data) {
        throw new Error('Invalid email or password');
      }
      
      // In a real app, we would verify the password hash here
      // For this demo, we're skipping proper password verification
      
      const userData: User = {
        id: data.id,
        email: data.email,
        role: data.role as AppRole
      };
      
      // Store user data in session storage
      sessionStorage.setItem('protostar_user', JSON.stringify(userData));
      setUser(userData);
      
      toast({
        title: 'Login successful',
        description: `Welcome, ${userData.email}!`,
      });
      
    } catch (error) {
      console.error('Login error:', error);
      toast({
        title: 'Login failed',
        description: error instanceof Error ? error.message : 'An error occurred during login',
        variant: 'destructive',
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      setLoading(true);
      // Clear session storage
      sessionStorage.removeItem('protostar_user');
      setUser(null);
      toast({
        title: 'Logged out',
        description: 'You have been successfully logged out.',
      });
    } catch (error) {
      console.error('Logout error:', error);
      toast({
        title: 'Logout failed',
        description: 'An error occurred during logout',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
