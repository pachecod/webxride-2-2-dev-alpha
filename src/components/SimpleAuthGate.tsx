import React, { useState, useEffect } from 'react';
import { SimpleLogin } from './SimpleLogin';
import { authenticateUser } from '../lib/supabase';

interface SimpleAuthGateProps {
  children: React.ReactNode;
  onUserSelect: (username: string) => void;
}

export const SimpleAuthGate: React.FC<SimpleAuthGateProps> = ({ children, onUserSelect }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authenticatedUser, setAuthenticatedUser] = useState<string | null>(null);

  // Check if user is already authenticated on mount
  useEffect(() => {
    const savedUser = localStorage.getItem('authenticatedUser');
    if (savedUser) {
      setAuthenticatedUser(savedUser);
      setIsAuthenticated(true);
      onUserSelect(savedUser);
    }
  }, [onUserSelect]);

  const handleLogin = async (username: string, password: string) => {
    try {
      const { data, error } = await authenticateUser(username, password);
      
      if (error) {
        throw error;
      }
      
      if (data) {
        // Authentication successful
        setAuthenticatedUser(username);
        setIsAuthenticated(true);
        localStorage.setItem('authenticatedUser', username);
        onUserSelect(username);
      } else {
        throw new Error('Authentication failed');
      }
    } catch (error) {
      console.error('Authentication error:', error);
      throw error; // Re-throw so SimpleLogin can show the error
    }
  };

  const handleLogout = () => {
    setAuthenticatedUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem('authenticatedUser');
    onUserSelect(''); // Clear the selected user
  };

  if (!isAuthenticated) {
    return <SimpleLogin onLogin={handleLogin} />;
  }

  return (
    <div className="h-full flex flex-col">
      {children}
    </div>
  );
};
