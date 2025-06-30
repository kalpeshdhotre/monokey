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
  updateUserInContext: (updates: Partial<User>) => void;
  isInitialLoading: boolean;
  isAuthProcessing: boolean;
  isMonoKeyVerified: boolean;
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
  const [isMonoKeyVerified, setIsMonoKeyVerified] = useState(false);
  
  const initializationRef = useRef(false);
  const authStateChangeRef = useRef(false);
  const isMountedRef = useRef(true);
  const processingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      if (processingTimeoutRef.current) {
        clearTimeout(processingTimeoutRef.current);
      }
    };
  }, []);

  // CRITICAL FIX: Add safety timeout for processing state
  const setAuthProcessingWithTimeout = (processing: boolean) => {
    if (!isMountedRef.current) return;
    
    setIsAuthProcessing(processing);
    
    if (processing) {
      // Clear any existing timeout
      if (processingTimeoutRef.current) {
        clearTimeout(processingTimeoutRef.current);
      }
      
      // Set a safety timeout to prevent infinite loading
      processingTimeoutRef.current = setTimeout(() => {
        console.warn('AuthContext: Processing timeout reached, forcing reset');
        if (isMountedRef.current) {
          setIsAuthProcessing(false);
        }
      }, 10000); // 10 second timeout
    } else {
      // Clear timeout when processing is done
      if (processingTimeoutRef.current) {
        clearTimeout(processingTimeoutRef.current);
        processingTimeoutRef.current = null;
      }
    }
  };

  const clearAuthData = async () => {
    console.log('AuthContext: Clearing auth data...');
    
    // Reset state first
    if (isMountedRef.current) {
      setUser(null);
      setIsAuthenticated(false);
      setMonoKeyState(null);
      setIsMonoKeyVerified(false);
      setAuthProcessingWithTimeout(false);
    }
    
    // Clear all session data from storage
    await authService.clearSession();
    
    // Use Supabase's sign out to properly clear session data
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error('AuthContext: Error during sign out:', error);
    }
  };

  const fetchUserProfile = async (authUser: SupabaseUser): Promise<User | null> => {
    try {
      console.log('AuthContext: Fetching user profile for:', authUser.id);
      
      const { data: profile, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', authUser.id)
        .single();

      if (error) {
        console.error('AuthContext: Error fetching user profile:', error);
        return null;
      }

      if (!profile) {
        console.error('AuthContext: No profile found for user:', authUser.id);
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

      console.log('AuthContext: User profile fetched successfully:', userProfile.email);
      return userProfile;
    } catch (error) {
      console.error('AuthContext: Error fetching user profile:', error);
      return null;
    }
  };

  const refreshUser = async () => {
    try {
      console.log('AuthContext: Refreshing user...');
      const { data: { user: authUser }, error } = await supabase.auth.getUser();
      
      if (error) {
        console.error('AuthContext: Error getting user:', error);
        // If there's an auth error, clear potentially stale session data
        if (error.message?.includes('refresh_token_not_found') || error.message?.includes('Invalid Refresh Token')) {
          await authService.clearSession();
        }
        if (isMountedRef.current) {
          setUser(null);
          setIsAuthenticated(false);
          setMonoKeyState(null);
          setIsMonoKeyVerified(false);
        }
        return;
      }

      if (authUser) {
        const userProfile = await fetchUserProfile(authUser);
        if (userProfile && isMountedRef.current) {
          setUser(userProfile);
          setIsAuthenticated(true);
          console.log('AuthContext: User refreshed successfully');
        } else if (isMountedRef.current) {
          setUser(null);
          setIsAuthenticated(false);
          setMonoKeyState(null);
          setIsMonoKeyVerified(false);
        }
      } else if (isMountedRef.current) {
        setUser(null);
        setIsAuthenticated(false);
        setMonoKeyState(null);
        setIsMonoKeyVerified(false);
      }
    } catch (error) {
      console.error('AuthContext: Error refreshing user:', error);
      if (isMountedRef.current) {
        setUser(null);
        setIsAuthenticated(false);
        setMonoKeyState(null);
        setIsMonoKeyVerified(false);
      }
    }
  };

  // NEW: Function to update user in context without full refresh
  const updateUserInContext = (updates: Partial<User>) => {
    if (isMountedRef.current && user) {
      console.log('AuthContext: Updating user in context:', updates);
      setUser(prev => prev ? { ...prev, ...updates } : null);
    }
  };

  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      // Prevent multiple initializations
      if (initializationRef.current) {
        console.log('AuthContext: Auth already initializing, skipping...');
        return;
      }
      
      initializationRef.current = true;
      
      if (mounted && isMountedRef.current) {
        setIsInitialLoading(true);
      }
      
      try {
        console.log('AuthContext: Initializing auth...');
        
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
          console.error('AuthContext: Session error:', error);
          // Clear potentially stale session data on error
          if (error.message?.includes('refresh_token_not_found') || error.message?.includes('Invalid Refresh Token')) {
            await authService.clearSession();
          }
          if (mounted && isMountedRef.current) {
            setUser(null);
            setIsAuthenticated(false);
          }
          return;
        }

        if (session?.user && mounted && isMountedRef.current) {
          console.log('AuthContext: Found existing session for:', session.user.email);
          const userProfile = await fetchUserProfile(session.user);
          if (userProfile && mounted && isMountedRef.current) {
            setUser(userProfile);
            setIsAuthenticated(true);
            console.log('AuthContext: Auth initialized with existing session');
          } else if (mounted && isMountedRef.current) {
            setUser(null);
            setIsAuthenticated(false);
          }
        } else if (mounted && isMountedRef.current) {
          console.log('AuthContext: No existing session found');
          setUser(null);
          setIsAuthenticated(false);
        }
      } catch (error) {
        console.error('AuthContext: Auth initialization error:', error);
        if (mounted && isMountedRef.current) {
          setUser(null);
          setIsAuthenticated(false);
        }
      } finally {
        if (mounted && isMountedRef.current) {
          setIsInitialLoading(false);
        }
        initializationRef.current = false;
      }
    };

    initializeAuth();

    // Listen for auth changes with debouncing
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted || !isMountedRef.current) return;

        // Prevent handling auth state changes during initialization
        if (initializationRef.current) {
          console.log('AuthContext: Skipping auth state change during initialization');
          return;
        }

        // Debounce auth state changes
        if (authStateChangeRef.current) {
          console.log('AuthContext: Auth state change already in progress, skipping...');
          return;
        }

        authStateChangeRef.current = true;
        console.log('AuthContext: Auth state change:', event, session?.user?.email || 'no user');

        try {
          if (event === 'SIGNED_OUT') {
            console.log('AuthContext: User signed out - clearing all auth state');
            if (isMountedRef.current) {
              setUser(null);
              setIsAuthenticated(false);
              setMonoKeyState(null);
              setIsMonoKeyVerified(false);
              setAuthProcessingWithTimeout(false);
            }
            return;
          }

          if (event === 'SIGNED_IN' && session?.user) {
            console.log('AuthContext: User signed in:', session.user.email);
            
            // Only set processing for explicit sign-in events
            if (isMountedRef.current) {
              setAuthProcessingWithTimeout(true);
            }
            
            try {
              const userProfile = await fetchUserProfile(session.user);
              if (userProfile && mounted && isMountedRef.current) {
                setUser(userProfile);
                setIsAuthenticated(true);
                // Don't clear MonoKey on sign in - it should persist
                console.log('AuthContext: Sign in completed successfully');
              } else if (mounted && isMountedRef.current) {
                console.error('AuthContext: Failed to fetch user profile after sign in');
                setUser(null);
                setIsAuthenticated(false);
                setMonoKeyState(null);
                setIsMonoKeyVerified(false);
              }
            } finally {
              // CRITICAL FIX: Always reset processing state
              if (mounted && isMountedRef.current) {
                setAuthProcessingWithTimeout(false);
              }
            }
            return;
          }

          if (event === 'TOKEN_REFRESHED' && session?.user) {
            console.log('AuthContext: Token refreshed for:', session.user.email);
            // CRITICAL: Silent background refresh - don't show loading state or set processing
            // Only update user if needed, preserve MonoKey and don't trigger loading
            if (!user || user.id !== session.user.id) {
              const userProfile = await fetchUserProfile(session.user);
              if (userProfile && mounted && isMountedRef.current) {
                setUser(userProfile);
                setIsAuthenticated(true);
                console.log('AuthContext: User profile updated after token refresh');
              }
            }
            return;
          }

          // For any other event without a session
          if (!session && mounted && isMountedRef.current) {
            setUser(null);
            setIsAuthenticated(false);
            setMonoKeyState(null);
            setIsMonoKeyVerified(false);
            setAuthProcessingWithTimeout(false);
          }
        } catch (error) {
          console.error('AuthContext: Auth state change error:', error);
          if (mounted && isMountedRef.current) {
            setUser(null);
            setIsAuthenticated(false);
            setMonoKeyState(null);
            setIsMonoKeyVerified(false);
            setAuthProcessingWithTimeout(false);
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
    console.log('AuthContext: Signing in user:', email);
    if (isMountedRef.current) {
      setAuthProcessingWithTimeout(true);
    }
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ 
        email, 
        password 
      });
      
      if (error) {
        console.error('AuthContext: Sign in error:', error);
        if (isMountedRef.current) {
          setAuthProcessingWithTimeout(false);
        }
        
        // Provide user-friendly error messages
        if (error.message === 'Invalid login credentials') {
          throw new Error('Incorrect email or password. Please try again.');
        }
        
        throw error;
      }

      console.log('AuthContext: Sign in successful, waiting for auth state change...');
      // Don't set isAuthProcessing to false here - let the auth state change handler do it
    } catch (error) {
      console.error('AuthContext: Sign in failed:', error);
      if (isMountedRef.current) {
        setAuthProcessingWithTimeout(false);
      }
      throw error;
    }
  };

  const signUp = async (email: string, password: string, userData: {
    firstName: string;
    lastName: string;
    phoneNumber?: string;
    monoPasswordHash: string;
  }) => {
    console.log('AuthContext: Signing up user:', email);
    if (isMountedRef.current) {
      setAuthProcessingWithTimeout(true);
    }
    
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
        console.error('AuthContext: Sign up error:', authError);
        if (isMountedRef.current) {
          setAuthProcessingWithTimeout(false);
        }
        
        // Provide user-friendly error messages
        if (authError.message === 'User already registered') {
          throw new Error('This email is already registered. Please try logging in instead.');
        }
        
        throw authError;
      }

      if (!authData.user) {
        if (isMountedRef.current) {
          setAuthProcessingWithTimeout(false);
        }
        throw new Error('Failed to create user account');
      }

      console.log('AuthContext: Sign up successful, waiting for profile creation...');
      
      // Wait for the trigger to complete
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Fetch and set the complete user profile
      const userProfile = await fetchUserProfile(authData.user);
      if (userProfile && isMountedRef.current) {
        setUser(userProfile);
        setIsAuthenticated(true);
        console.log('AuthContext: Sign up completed successfully');
      } else {
        if (isMountedRef.current) {
          setAuthProcessingWithTimeout(false);
        }
        throw new Error('Failed to create user profile');
      }
    } catch (error) {
      console.error('AuthContext: Sign up failed:', error);
      if (isMountedRef.current) {
        setAuthProcessingWithTimeout(false);
      }
      throw error;
    } finally {
      if (isMountedRef.current) {
        setAuthProcessingWithTimeout(false);
      }
    }
  };

  const signOut = async () => {
    console.log('AuthContext: Signing out user...');
    if (isMountedRef.current) {
      setAuthProcessingWithTimeout(true);
    }
    
    try {
      // Clear state first - including MonoKey
      if (isMountedRef.current) {
        setUser(null);
        setIsAuthenticated(false);
        setMonoKeyState(null);
        setIsMonoKeyVerified(false);
      }
      
      // Clear all session data from storage
      await authService.clearSession();
      
      // Then sign out from Supabase
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('AuthContext: Sign out error:', error);
      }
      
      console.log('AuthContext: Sign out completed');
    } catch (error) {
      console.error('AuthContext: Sign out failed:', error);
    } finally {
      if (isMountedRef.current) {
        setAuthProcessingWithTimeout(false);
      }
    }
  };

  const verifyMonoKey = (inputKey: string): boolean => {
    if (!user?.monoPasswordHash) return false;
    
    const inputHash = CryptoJS.SHA256(inputKey).toString();
    return inputHash === user.monoPasswordHash;
  };

  const setMonoKey = (key: string) => {
    console.log('AuthContext: Setting MonoKey - this should persist until logout');
    if (isMountedRef.current) {
      setMonoKeyState(key);
      setIsMonoKeyVerified(true);
    }
  };

  const value = {
    user,
    isAuthenticated,
    isLoading: isInitialLoading || isAuthProcessing, // Maintain backward compatibility
    isInitialLoading,
    isAuthProcessing,
    isMonoKeyVerified,
    signIn,
    signUp,
    signOut,
    verifyMonoKey,
    setMonoKey,
    monoKey,
    clearAuthData,
    refreshUser,
    updateUserInContext
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};