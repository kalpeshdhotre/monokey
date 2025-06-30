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
  const { user, monoKey, isInitialLoading } = useAuth();
  const [credentials, setCredentials] = useState<Credential[]>([]);
  const [isLoadingCredentials, setIsLoadingCredentials] = useState(false);
  const [hasLoadedCredentials, setHasLoadedCredentials] = useState(false);
  const loadingRef = useRef(false);
  const lastUserIdRef = useRef<string | null>(null);
  const lastMonoKeyStatusRef = useRef<boolean>(false);
  const isMountedRef = useRef(true);

  // Only auto-load when user or monoKey status actually changes
  useEffect(() => {
    const currentUserId = user?.id || null;
    const currentMonoKeyStatus = !!monoKey;
    
    console.log('CredentialContext useEffect - user:', user?.email, 'monoKey:', !!monoKey, 'hasLoaded:', hasLoadedCredentials, 'isInitialLoading:', isInitialLoading);
    
    // Don't proceed if auth is still loading initially
    if (isInitialLoading) {
      console.log('Auth still loading, waiting...');
      return;
    }

    // Check if user changed (including logout)
    if (lastUserIdRef.current !== currentUserId) {
      console.log('User changed from', lastUserIdRef.current, 'to', currentUserId);
      lastUserIdRef.current = currentUserId;
      lastMonoKeyStatusRef.current = currentMonoKeyStatus;
      
      // Reset state for user change
      if (isMountedRef.current) {
        setHasLoadedCredentials(false);
        setCredentials([]);
        setIsLoadingCredentials(false);
        loadingRef.current = false;
      }
      
      // If no user (logout), clear everything and return
      if (!currentUserId) {
        console.log('No user, clearing credentials');
        return;
      }
    }

    // Check if monoKey status changed
    if (lastMonoKeyStatusRef.current !== currentMonoKeyStatus) {
      console.log('MonoKey status changed from', lastMonoKeyStatusRef.current, 'to', currentMonoKeyStatus);
      lastMonoKeyStatusRef.current = currentMonoKeyStatus;
      
      // Only reset if monoKey became available and we haven't loaded yet
      if (currentMonoKeyStatus && !hasLoadedCredentials && isMountedRef.current) {
        console.log('MonoKey became available, will load credentials');
        setHasLoadedCredentials(false);
        loadingRef.current = false;
      }
    }

    // Auto-load credentials only when:
    // 1. User and monoKey are available
    // 2. We haven't loaded credentials yet for this user/monoKey combination
    // 3. We're not already loading
    // 4. Component is still mounted
    if (user && monoKey && !hasLoadedCredentials && !loadingRef.current && isMountedRef.current) {
      console.log('Auto-loading credentials for user:', user.email);
      loadCredentials();
    }
  }, [user?.id, !!monoKey, isInitialLoading]); // Simplified dependencies to prevent unnecessary re-renders

  // Cleanup on unmount
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const loadCredentials = async () => {
    if (!monoKey) {
      console.log('No monoKey available for loading credentials');
      return;
    }

    if (loadingRef.current) {
      console.log('Already loading credentials, skipping...');
      return;
    }

    if (!isMountedRef.current) {
      console.log('Component unmounted, skipping credential load');
      return;
    }

    loadingRef.current = true;
    setIsLoadingCredentials(true);
    
    try {
      console.log('Loading credentials from database...');
      const creds = await DatabaseService.getCredentials(monoKey);
      console.log('Loaded', creds.length, 'credentials');
      
      if (isMountedRef.current) {
        setCredentials(creds);
        setHasLoadedCredentials(true);
      }
    } catch (error: any) {
      console.error('Load credentials error:', error);
      if (isMountedRef.current) {
        toast.error('Failed to load credentials');
        // Don't set hasLoadedCredentials to true on error
      }
    } finally {
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
      
      // Add the new credential to state
      const newCredential: Credential = {
        id: savedCredential.id,
        ...credentialData,
        createdAt: savedCredential.createdAt,
        updatedAt: savedCredential.updatedAt
      };
      
      if (isMountedRef.current) {
        setCredentials(prev => [newCredential, ...prev]);
      }
      console.log('Credential added successfully');
    } catch (error) {
      console.error('Add credential error:', error);
      throw error;
    }
  };

  const updateCredential = async (id: string, credentialData: Partial<Credential>) => {
    if (!monoKey) {
      throw new Error('MonoKey required');
    }

    try {
      await DatabaseService.updateCredential(id, credentialData, monoKey);
      
      // Update the credential in state
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
      console.log('Credential updated successfully');
    } catch (error) {
      console.error('Update credential error:', error);
      throw error;
    }
  };

  const removeCredential = async (id: string) => {
    try {
      await DatabaseService.deleteCredential(id);
      
      // Remove the credential from state
      if (isMountedRef.current) {
        setCredentials(prev => prev.filter(cred => cred.id !== id));
      }
      console.log('Credential removed successfully');
    } catch (error) {
      console.error('Remove credential error:', error);
      throw error;
    }
  };

  const clearCredentials = () => {
    console.log('Clearing credentials from context');
    if (isMountedRef.current) {
      setCredentials([]);
      setHasLoadedCredentials(false);
      setIsLoadingCredentials(false);
    }
    loadingRef.current = false;
    lastUserIdRef.current = null;
    lastMonoKeyStatusRef.current = false;
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