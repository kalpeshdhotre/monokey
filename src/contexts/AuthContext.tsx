import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { User as SupabaseUser } from '@supabase/supabase-js';
import { supabase, authService } from '../utils/supabase';
import { AuthState, User } from '../types';
import CryptoJS from 'crypto-js';

interface AuthContextType extends AuthState {
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, userData: any) => Promise<void>;
  signOut: () => Promise<void>;
  verifyMonoKey: (monoKey: string) => boolean;
  setMonoKey: (password: string) => void;
  monoKey: string | null;
  clearAuthData: () => Promise<void>;
  refreshUser: () => Promise<void>;
  isInitialLoading: boolean;
  isAuthProcessing: boolean;
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
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isAuthProcessing, setIsAuthProcessing] = useState(false);
  const [monoKey, setMonoKeyState] = useState<string | null>(null);
  const initializationRef = useRef(false);
  const authStateChangeRef = useRef(false);

  const clearAuthData = async () => {
    console.log('Clearing auth data...');
    
    // Reset state first
    setUser(null);
    setIsAuthenticated(false);
    setMonoKeyState(null);
    
    // Clear all session data from storage
    await authService.clearSession();
    
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
        // If there's an auth error, clear potentially stale session data
        if (error.message?.includes('refresh_token_not_found') || error.message?.includes('Invalid Refresh Token')) {
          await authService.clearSession();
        }
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
      setIsInitialLoading(true);
      
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
          // Clear potentially stale session data on error
          if (error.message?.includes('refresh_token_not_found') || error.message?.includes('Invalid Refresh Token')) {
            await authService.clearSession();
          }
          if (mounted) {
            setUser(null);
            setIsAuthenticated(false);
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
          setIsInitialLoading(false);
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
            setMonoKeyState(null);
            setIsAuthProcessing(false);
            return;
          }

          if (event === 'SIGNED_IN' && session?.user) {
            console.log('User signed in:', session.user.email);
            setIsAuthProcessing(true);
            
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
              setIsAuthProcessing(false);
            }
            return;
          }

          if (event === 'TOKEN_REFRESHED' && session?.user) {
            console.log('Token refreshed for:', session.user.email);
            // Silent background refresh - don't show loading state
            // Only update user if needed
            if (!user || user.id !== session.user.id) {
              const userProfile = await fetchUserProfile(session.user);
              if (userProfile && mounted) {
                setUser(userProfile);
                setIsAuthenticated(true);
                console.log('User profile updated after token refresh');
              }
            }
            return;
          }

          // For any other event without a session
          if (!session && mounted) {
            setUser(null);
            setIsAuthenticated(false);
            setIsAuthProcessing(false);
          }
        } catch (error) {
          console.error('Auth state change error:', error);
          if (mounted) {
            setUser(null);
            setIsAuthenticated(false);
            setIsAuthProcessing(false);
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
  }, []);

  const signIn = async (email: string, password: string) => {
    console.log('Signing in user:', email);
    setIsAuthProcessing(true);
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ 
        email, 
        password 
      });
      
      if (error) {
        console.error('Sign in error:', error);
        setIsAuthProcessing(false);
        
        // Provide user-friendly error messages
        if (error.message === 'Invalid login credentials') {
          throw new Error('Incorrect email or password. Please try again.');
        }
        
        throw error;
      }

      console.log('Sign in successful, waiting for auth state change...');
      // Don't set isAuthProcessing to false here - let the auth state change handler do it
    } catch (error) {
      console.error('Sign in failed:', error);
      setIsAuthProcessing(false);
      throw error;
    }
  };

  const signUp = async (email: string, password: string, userData: {
    firstName: string;
    lastName: string;
    phoneNumber?: string;
    monoPasswordHash: string;
  }) => {
    console.log('Signing up user:', email);
    setIsAuthProcessing(true);
    
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
            storageLocation: 'saas'
          }
        }
      });

      if (authError) {
        console.error('Sign up error:', authError);
        setIsAuthProcessing(false);
        
        // Provide user-friendly error messages
        if (authError.message === 'User already registered') {
          throw new Error('This email is already registered. Please try logging in instead.');
        }
        
        throw authError;
      }

      if (!authData.user) {
        setIsAuthProcessing(false);
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
        setIsAuthProcessing(false);
        throw new Error('Failed to create user profile');
      }
    } catch (error) {
      console.error('Sign up failed:', error);
      setIsAuthProcessing(false);
      throw error;
    } finally {
      setIsAuthProcessing(false);
    }
  };

  const signOut = async () => {
    console.log('Signing out user...');
    setIsAuthProcessing(true);
    
    try {
      // Clear state first
      setUser(null);
      setIsAuthenticated(false);
      setMonoKeyState(null);
      
      // Clear all session data from storage
      await authService.clearSession();
      
      // Then sign out from Supabase
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Sign out error:', error);
      }
      
      console.log('Sign out completed');
    } catch (error) {
      console.error('Sign out failed:', error);
    } finally {
      setIsAuthProcessing(false);
    }
  };

  const verifyMonoKey = (inputKey: string): boolean => {
    if (!user?.monoPasswordHash) return false;
    
    const inputHash = CryptoJS.SHA256(inputKey).toString();
    return inputHash === user.monoPasswordHash;
  };

  const setMonoKey = (key: string) => {
    setMonoKeyState(key);
  };

  const value = {
    user,
    isAuthenticated,
    isLoading: isInitialLoading || isAuthProcessing, // Maintain backward compatibility
    isInitialLoading,
    isAuthProcessing,
    signIn,
    signUp,
    signOut,
    verifyMonoKey,
    setMonoKey,
    monoKey,
    clearAuthData,
    refreshUser
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};