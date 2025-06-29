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
  refreshUser: () => Promise<void>;
  resetAuthState: () => void;
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
  const [authInitialized, setAuthInitialized] = useState(false);

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

  const resetAuthState = () => {
    setUser(null);
    setIsAuthenticated(false);
    setMonoPasswordState(null);
    setIsLoading(false);
    setAuthInitialized(true);
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

  const refreshUser = async () => {
    try {
      const { data: { user: authUser }, error } = await supabase.auth.getUser();
      
      if (error) {
        console.error('Error getting user:', error);
        resetAuthState();
        return;
      }

      if (authUser) {
        const userProfile = await fetchUserProfile(authUser);
        if (userProfile) {
          setUser(userProfile);
          setIsAuthenticated(true);
        } else {
          resetAuthState();
        }
      } else {
        resetAuthState();
      }
    } catch (error) {
      console.error('Error refreshing user:', error);
      resetAuthState();
    }
  };

  useEffect(() => {
    let mounted = true;
    let retryCount = 0;
    const maxRetries = 3;

    // Initialize authentication state with retry logic
    const initializeAuth = async () => {
      try {
        // First, try to get the current session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error('Session error:', sessionError);
          
          // If session is corrupted, clear it and retry
          if (retryCount < maxRetries) {
            retryCount++;
            console.log(`Retrying auth initialization (${retryCount}/${maxRetries})`);
            await supabase.auth.signOut();
            setTimeout(initializeAuth, 1000);
            return;
          } else {
            // Max retries reached, reset state
            if (mounted) {
              resetAuthState();
            }
            return;
          }
        }

        if (session?.user && mounted) {
          try {
            const userProfile = await fetchUserProfile(session.user);
            if (userProfile && mounted) {
              setUser(userProfile);
              setIsAuthenticated(true);
            } else if (mounted) {
              resetAuthState();
            }
          } catch (profileError) {
            console.error('Profile fetch error:', profileError);
            if (mounted) {
              resetAuthState();
            }
          }
        } else if (mounted) {
          resetAuthState();
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        if (mounted) {
          resetAuthState();
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
          setAuthInitialized(true);
        }
      }
    };

    initializeAuth();

    // Listen for auth changes with error handling
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted || !authInitialized) return;

        console.log('Auth state change:', event, !!session);

        try {
          if (event === 'SIGNED_OUT' || !session) {
            setUser(null);
            setIsAuthenticated(false);
            setMonoPasswordState(null);
            setIsLoading(false);
            return;
          }

          if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
            if (session?.user) {
              const userProfile = await fetchUserProfile(session.user);
              if (userProfile && mounted) {
                setUser(userProfile);
                setIsAuthenticated(true);
              } else if (mounted) {
                setUser(null);
                setIsAuthenticated(false);
              }
            }
          }
        } catch (error) {
          console.error('Auth state change error:', error);
          if (mounted) {
            setUser(null);
            setIsAuthenticated(false);
          }
        } finally {
          if (mounted) {
            setIsLoading(false);
          }
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
    } catch (error) {
      setIsLoading(false);
      throw error;
    }
  };

  const signUp = async (email: string, password: string, userData: {
    firstName: string;
    lastName: string;
    phoneNumber?: string;
    monoPasswordHash: string;
    storageLocation?: string;
  }) => {
    setIsLoading(true);
    try {
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
    } catch (error) {
      setIsLoading(false);
      throw error;
    }
  };

  const signOut = async () => {
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      setMonoPasswordState(null);
      clearAuthData();
    } catch (error) {
      console.error('Sign out error:', error);
    } finally {
      setIsLoading(false);
    }
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
    clearAuthData,
    refreshUser,
    resetAuthState
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};