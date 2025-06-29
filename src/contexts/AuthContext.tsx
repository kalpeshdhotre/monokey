import React, { createContext, useContext, useEffect, useState } from 'react';
import { User as SupabaseUser } from '@supabase/supabase-js';
import { supabase } from '../utils/supabase';
import { AuthState, User } from '../types';
import CryptoJS from 'crypto-js';

interface AuthContextType extends AuthState {
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, userData: any) => Promise<void>;
  signOut: () => Promise<void>;
  verifyMonoPassword: (monoPassword: string) => boolean;
  setMonoPassword: (password: string) => void;
  monoPassword: string | null;
  clearAuthData: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [monoPassword, setMonoPasswordState] = useState<string | null>(null);

  const clearAuthData = () => {
    // Clear all possible authentication storage
    localStorage.clear();
    sessionStorage.clear();
    
    // Clear Supabase specific storage
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.startsWith('sb-') || key.includes('supabase')) {
        localStorage.removeItem(key);
      }
    });

    // Clear session storage
    const sessionKeys = Object.keys(sessionStorage);
    sessionKeys.forEach(key => {
      if (key.startsWith('sb-') || key.includes('supabase')) {
        sessionStorage.removeItem(key);
      }
    });

    // Reset state
    setUser(null);
    setIsAuthenticated(false);
    setMonoPasswordState(null);
  };

  const fetchUserProfile = async (authUser: SupabaseUser): Promise<User | null> => {
    try {
      const { data: profile, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', authUser.id)
        .single();

      if (error) {
        console.error('Error fetching user profile:', error);
        return null;
      }

      return {
        id: authUser.id,
        email: authUser.email!,
        firstName: profile.first_name,
        lastName: profile.last_name,
        phoneNumber: profile.phone_number,
        storageLocation: profile.storage_location,
        monoPasswordHash: profile.mono_password_hash,
        createdAt: profile.created_at
      };
    } catch (error) {
      console.error('Error fetching user profile:', error);
      return null;
    }
  };

  useEffect(() => {
    let mounted = true;

    // Initialize authentication state
    const initializeAuth = async () => {
      try {
        // Get current session without clearing data
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Session error:', error);
          if (mounted) {
            setUser(null);
            setIsAuthenticated(false);
            setIsLoading(false);
          }
          return;
        }

        if (session?.user && mounted) {
          const userProfile = await fetchUserProfile(session.user);
          if (userProfile) {
            setUser(userProfile);
            setIsAuthenticated(true);
          } else {
            setUser(null);
            setIsAuthenticated(false);
          }
        } else if (mounted) {
          setUser(null);
          setIsAuthenticated(false);
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        if (mounted) {
          setUser(null);
          setIsAuthenticated(false);
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    initializeAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;

        try {
          if (session?.user) {
            const userProfile = await fetchUserProfile(session.user);
            setUser(userProfile);
            setIsAuthenticated(!!userProfile);
          } else {
            setUser(null);
            setIsAuthenticated(false);
          }
        } catch (error) {
          console.error('Auth state change error:', error);
          setUser(null);
          setIsAuthenticated(false);
        } finally {
          setIsLoading(false);
        }
        
        if (event === 'SIGNED_OUT') {
          setMonoPasswordState(null);
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  };

  const signUp = async (email: string, password: string, userData: {
    firstName: string;
    lastName: string;
    phoneNumber?: string;
    monoPasswordHash: string;
    storageLocation?: string;
  }) => {
    // Use Supabase auth signup with metadata - the trigger will handle profile creation
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          firstName: userData.firstName,
          lastName: userData.lastName,
          phoneNumber: userData.phoneNumber,
          monoPasswordHash: userData.monoPasswordHash,
          storageLocation: userData.storageLocation || 'saas'
        }
      }
    });

    if (authError) throw authError;

    if (!authData.user) {
      throw new Error('Failed to create user account');
    }

    // Wait a moment for the trigger to complete
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Fetch and set the complete user profile
    const userProfile = await fetchUserProfile(authData.user);
    if (userProfile) {
      setUser(userProfile);
      setIsAuthenticated(true);
    }
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    setMonoPasswordState(null);
    clearAuthData();
  };

  const verifyMonoPassword = (inputPassword: string): boolean => {
    if (!user?.monoPasswordHash) return false;
    
    const inputHash = CryptoJS.SHA256(inputPassword).toString();
    return inputHash === user.monoPasswordHash;
  };

  const setMonoPassword = (password: string) => {
    setMonoPasswordState(password);
  };

  const value = {
    user,
    isAuthenticated,
    isLoading,
    signIn,
    signUp,
    signOut,
    verifyMonoPassword,
    setMonoPassword,
    monoPassword,
    clearAuthData
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};