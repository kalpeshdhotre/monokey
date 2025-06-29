import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
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
  clearAuthData: () => Promise<void>;
  refreshUser: () => Promise<void>;
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
  const initializationRef = useRef(false);
  const authStateChangeRef = useRef(false);

  const clearAuthData = async () => {
    console.log('Clearing auth data...');
    
    // Reset state first
    setUser(null);
    setIsAuthenticated(false);
    setMonoPasswordState(null);
    
    // Use Supabase's sign out to properly clear session data
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error('Error during sign out:', error);
    }
  };

  const fetchUserProfile = async (authUser: SupabaseUser): Promise<User | null> => {
    try {
      console.log('Fetching user profile for:', authUser.id);
      
      const { data: profile, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', authUser.id)
        .single();

      if (error) {
        console.error('Error fetching user profile:', error);
        return null;
      }

      if (!profile) {
        console.error('No profile found for user:', authUser.id);
        return null;
      }

      const userProfile = {
        id: authUser.id,
        email: authUser.email!,
        firstName: profile.first_name,
        lastName: profile.last_name,
        phoneNumber: profile.phone_number,
        storageLocation: profile.storage_location,
        monoPasswordHash: profile.mono_password_hash,
        createdAt: profile.created_at
      };

      console.log('User profile fetched successfully:', userProfile.email);
      return userProfile;
    } catch (error) {
      console.error('Error fetching user profile:', error);
      return null;
    }
  };

  const refreshUser = async () => {
    try {
      console.log('Refreshing user...');
      const { data: { user: authUser }, error } = await supabase.auth.getUser();
      
      if (error) {
        console.error('Error getting user:', error);
        setUser(null);
        setIsAuthenticated(false);
        return;
      }

      if (authUser) {
        const userProfile = await fetchUserProfile(authUser);
        if (userProfile) {
          setUser(userProfile);
          setIsAuthenticated(true);
          console.log('User refreshed successfully');
        } else {
          setUser(null);
          setIsAuthenticated(false);
        }
      } else {
        setUser(null);
        setIsAuthenticated(false);
      }
    } catch (error) {
      console.error('Error refreshing user:', error);
      setUser(null);
      setIsAuthenticated(false);
    }
  };

  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      // Prevent multiple initializations
      if (initializationRef.current) {
        console.log('Auth already initializing, skipping...');
        return;
      }
      
      initializationRef.current = true;
      
      try {
        console.log('Initializing auth...');
        
        // Get current session with timeout
        const sessionPromise = supabase.auth.getSession();
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Session fetch timeout')), 10000)
        );
        
        const { data: { session }, error } = await Promise.race([
          sessionPromise,
          timeoutPromise
        ]) as any;
        
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
          console.log('Found existing session for:', session.user.email);
          const userProfile = await fetchUserProfile(session.user);
          if (userProfile && mounted) {
            setUser(userProfile);
            setIsAuthenticated(true);
            console.log('Auth initialized with existing session');
          } else if (mounted) {
            setUser(null);
            setIsAuthenticated(false);
          }
        } else if (mounted) {
          console.log('No existing session found');
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
          initializationRef.current = false;
        }
      }
    };

    initializeAuth();

    // Listen for auth changes with debouncing
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;

        // Prevent handling auth state changes during initialization
        if (initializationRef.current) {
          console.log('Skipping auth state change during initialization');
          return;
        }

        // Debounce auth state changes
        if (authStateChangeRef.current) {
          console.log('Auth state change already in progress, skipping...');
          return;
        }

        authStateChangeRef.current = true;
        console.log('Auth state change:', event, session?.user?.email || 'no user');

        try {
          if (event === 'SIGNED_OUT') {
            console.log('User signed out');
            setUser(null);
            setIsAuthenticated(false);
            setMonoPasswordState(null);
            setIsLoading(false);
            return;
          }

          if (event === 'SIGNED_IN' && session?.user) {
            console.log('User signed in:', session.user.email);
            setIsLoading(true);
            
            const userProfile = await fetchUserProfile(session.user);
            if (userProfile && mounted) {
              setUser(userProfile);
              setIsAuthenticated(true);
              console.log('Sign in completed successfully');
            } else if (mounted) {
              console.error('Failed to fetch user profile after sign in');
              setUser(null);
              setIsAuthenticated(false);
            }
            
            if (mounted) {
              setIsLoading(false);
            }
            return;
          }

          if (event === 'TOKEN_REFRESHED' && session?.user) {
            console.log('Token refreshed for:', session.user.email);
            // Don't set loading for token refresh, just update user if needed
            if (!user || user.id !== session.user.id) {
              const userProfile = await fetchUserProfile(session.user);
              if (userProfile && mounted) {
                setUser(userProfile);
                setIsAuthenticated(true);
              }
            }
            return;
          }

          // For any other event without a session
          if (!session && mounted) {
            setUser(null);
            setIsAuthenticated(false);
            setIsLoading(false);
          }
        } catch (error) {
          console.error('Auth state change error:', error);
          if (mounted) {
            setUser(null);
            setIsAuthenticated(false);
            setIsLoading(false);
          }
        } finally {
          authStateChangeRef.current = false;
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
      initializationRef.current = false;
      authStateChangeRef.current = false;
    };
  }, []); // Remove user.id dependency to prevent re-initialization

  const signIn = async (email: string, password: string) => {
    console.log('Signing in user:', email);
    setIsLoading(true);
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ 
        email, 
        password 
      });
      
      if (error) {
        console.error('Sign in error:', error);
        setIsLoading(false);
        throw error;
      }

      console.log('Sign in successful, waiting for auth state change...');
      // Don't set loading to false here - let the auth state change handler do it
    } catch (error) {
      console.error('Sign in failed:', error);
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
    console.log('Signing up user:', email);
    setIsLoading(true);
    
    try {
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

      if (authError) {
        console.error('Sign up error:', authError);
        setIsLoading(false);
        throw authError;
      }

      if (!authData.user) {
        setIsLoading(false);
        throw new Error('Failed to create user account');
      }

      console.log('Sign up successful, waiting for profile creation...');
      
      // Wait for the trigger to complete
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Fetch and set the complete user profile
      const userProfile = await fetchUserProfile(authData.user);
      if (userProfile) {
        setUser(userProfile);
        setIsAuthenticated(true);
        console.log('Sign up completed successfully');
      } else {
        setIsLoading(false);
        throw new Error('Failed to create user profile');
      }
    } catch (error) {
      console.error('Sign up failed:', error);
      setIsLoading(false);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = async () => {
    console.log('Signing out user...');
    setIsLoading(true);
    
    try {
      // Clear state first
      setUser(null);
      setIsAuthenticated(false);
      setMonoPasswordState(null);
      
      // Then sign out from Supabase
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Sign out error:', error);
      }
      
      console.log('Sign out completed');
    } catch (error) {
      console.error('Sign out failed:', error);
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
    refreshUser
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};