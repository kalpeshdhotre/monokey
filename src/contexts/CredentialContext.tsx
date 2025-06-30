import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { useAuth } from './AuthContext';
import { DatabaseService } from '../utils/database';
import { Credential } from '../types';
import toast from 'react-hot-toast';

interface CredentialContextType {
  credentials: Credential[];
  isLoadingCredentials: boolean;
  hasLoadedCredentials: boolean;
  addCredential: (credential: Omit<Credential, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateCredential: (id: string, credential: Partial<Credential>) => Promise<void>;
  removeCredential: (id: string) => Promise<void>;
  loadCredentials: () => Promise<void>;
  clearCredentials: () => void;
}

const CredentialContext = createContext<CredentialContextType | undefined>(undefined);

export const useCredentials = () => {
  const context = useContext(CredentialContext);
  if (!context) {
    throw new Error('useCredentials must be used within a CredentialProvider');
  }
  return context;
};

export const CredentialProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, monoKey, isInitialLoading, isMonoKeyVerified } = useAuth();
  const [credentials, setCredentials] = useState<Credential[]>([]);
  const [isLoadingCredentials, setIsLoadingCredentials] = useState(false);
  const [hasLoadedCredentials, setHasLoadedCredentials] = useState(false);
  
  // Use refs to track state without causing re-renders
  const loadingRef = useRef(false);
  const currentUserRef = useRef<string | null>(null);
  const hasLoadedForCurrentUserRef = useRef(false);
  const isMountedRef = useRef(true);
  const lastLoadAttemptRef = useRef<number>(0);

  // Cleanup on unmount
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // CRITICAL FIX: Simplified effect that only triggers when we actually need to load
  useEffect(() => {
    // Skip if auth is still loading
    if (isInitialLoading) {
      console.log('CredentialContext: Skipping load - auth still initializing');
      return;
    }

    const userId = user?.id || null;
    const now = Date.now();

    // Check if user changed (including logout)
    if (currentUserRef.current !== userId) {
      console.log('CredentialContext: User changed, resetting state');
      currentUserRef.current = userId;
      hasLoadedForCurrentUserRef.current = false;
      
      if (isMountedRef.current) {
        setCredentials([]);
        setHasLoadedCredentials(false);
        setIsLoadingCredentials(false);
      }
      loadingRef.current = false;
      lastLoadAttemptRef.current = 0;
      
      // If no user, stop here
      if (!userId) {
        console.log('CredentialContext: No user, stopping');
        return;
      }
    }

    // CRITICAL: Only load if ALL conditions are met AND we haven't loaded recently
    const shouldLoad = userId && 
                      isMonoKeyVerified && 
                      monoKey && 
                      !hasLoadedForCurrentUserRef.current && 
                      !loadingRef.current &&
                      (now - lastLoadAttemptRef.current) > 1000; // Prevent rapid re-attempts

    if (shouldLoad && isMountedRef.current) {
      console.log('CredentialContext: All conditions met, loading credentials');
      lastLoadAttemptRef.current = now;
      loadCredentials();
    } else {
      console.log('CredentialContext: Conditions not met for loading:', {
        hasUser: !!userId,
        isMonoKeyVerified,
        hasMonoKey: !!monoKey,
        hasLoaded: hasLoadedForCurrentUserRef.current,
        isLoading: loadingRef.current,
        timeSinceLastAttempt: now - lastLoadAttemptRef.current
      });
    }
  }, [user?.id, isMonoKeyVerified, monoKey, isInitialLoading]);

  const loadCredentials = async () => {
    if (!monoKey || !user || !isMonoKeyVerified) {
      console.log('CredentialContext: Missing requirements for loading credentials:', { 
        hasMonoKey: !!monoKey, 
        hasUser: !!user, 
        isVerified: isMonoKeyVerified 
      });
      return;
    }

    if (loadingRef.current) {
      console.log('CredentialContext: Already loading credentials, skipping...');
      return;
    }

    if (!isMountedRef.current) {
      console.log('CredentialContext: Component unmounted, skipping credential load');
      return;
    }

    console.log('CredentialContext: Starting credential load...');
    loadingRef.current = true;
    
    if (isMountedRef.current) {
      setIsLoadingCredentials(true);
    }
    
    try {
      console.log('CredentialContext: Loading credentials from database...');
      const creds = await DatabaseService.getCredentials(monoKey);
      console.log('CredentialContext: Loaded', creds.length, 'credentials');
      
      if (isMountedRef.current) {
        setCredentials(creds);
        setHasLoadedCredentials(true);
        hasLoadedForCurrentUserRef.current = true;
        console.log('CredentialContext: Credentials loaded successfully');
      }
    } catch (error: any) {
      console.error('CredentialContext: Load credentials error:', error);
      if (isMountedRef.current) {
        toast.error('Failed to load credentials');
        // Don't mark as loaded on error
        setHasLoadedCredentials(false);
        hasLoadedForCurrentUserRef.current = false;
      }
    } finally {
      console.log('CredentialContext: Finishing credential load...');
      if (isMountedRef.current) {
        setIsLoadingCredentials(false);
      }
      loadingRef.current = false;
    }
  };

  const addCredential = async (credentialData: Omit<Credential, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (!monoKey) {
      throw new Error('MonoKey required');
    }

    try {
      const savedCredential = await DatabaseService.saveCredential(credentialData, monoKey);
      
      const newCredential: Credential = {
        id: savedCredential.id,
        ...credentialData,
        createdAt: savedCredential.createdAt,
        updatedAt: savedCredential.updatedAt
      };
      
      if (isMountedRef.current) {
        setCredentials(prev => [newCredential, ...prev]);
      }
    } catch (error) {
      console.error('CredentialContext: Add credential error:', error);
      throw error;
    }
  };

  const updateCredential = async (id: string, credentialData: Partial<Credential>) => {
    if (!monoKey) {
      throw new Error('MonoKey required');
    }

    try {
      await DatabaseService.updateCredential(id, credentialData, monoKey);
      
      if (isMountedRef.current) {
        setCredentials(prev => prev.map(cred => 
          cred.id === id 
            ? { 
                ...cred, 
                ...credentialData, 
                updatedAt: new Date().toISOString() 
              }
            : cred
        ));
      }
    } catch (error) {
      console.error('CredentialContext: Update credential error:', error);
      throw error;
    }
  };

  const removeCredential = async (id: string) => {
    try {
      await DatabaseService.deleteCredential(id);
      
      if (isMountedRef.current) {
        setCredentials(prev => prev.filter(cred => cred.id !== id));
      }
    } catch (error) {
      console.error('CredentialContext: Remove credential error:', error);
      throw error;
    }
  };

  const clearCredentials = () => {
    console.log('CredentialContext: Clearing credentials from context');
    if (isMountedRef.current) {
      setCredentials([]);
      setHasLoadedCredentials(false);
      setIsLoadingCredentials(false);
    }
    loadingRef.current = false;
    currentUserRef.current = null;
    hasLoadedForCurrentUserRef.current = false;
    lastLoadAttemptRef.current = 0;
  };

  const value = {
    credentials,
    isLoadingCredentials,
    hasLoadedCredentials,
    addCredential,
    updateCredential,
    removeCredential,
    loadCredentials,
    clearCredentials
  };

  return (
    <CredentialContext.Provider value={value}>
      {children}
    </CredentialContext.Provider>
  );
};