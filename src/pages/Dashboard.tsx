import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Plus, 
  Search, 
  Eye, 
  EyeOff, 
  Copy, 
  Edit, 
  Trash2, 
  Shield,
  Database,
  Cloud,
  HardDrive,
  RefreshCw,
  Sun,
  Moon,
  AlertTriangle,
  Upload,
  Download,
  FileText,
  FolderOpen,
  X,
  UserCheck,
  Save
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { DatabaseService } from '../utils/database';
import { LocalStorageService } from '../utils/localStorageService';
import { CryptoUtils } from '../utils/crypto';
import { Credential, StorageLocation } from '../types';
import Button from '../components/UI/Button';
import Input from '../components/UI/Input';
import Modal from '../components/UI/Modal';
import CredentialForm from '../components/CredentialForm';
import MonoPasswordPrompt from '../components/MonoPasswordPrompt';
import toast from 'react-hot-toast';

const Dashboard: React.FC = () => {
  const { user, monoPassword, setMonoPassword, verifyMonoPassword, isLoading: authLoading, refreshUser } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const [credentials, setCredentials] = useState<Credential[]>([]);
  const [localCredentials, setLocalCredentials] = useState<Credential[]>([]);
  const [filteredCredentials, setFilteredCredentials] = useState<Credential[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [storageLocation, setStorageLocation] = useState<StorageLocation>('saas');
  const [selectedLocalFile, setSelectedLocalFile] = useState<File | null>(null);
  const [localFileName, setLocalFileName] = useState<string>('');
  const [fileOwnerInfo, setFileOwnerInfo] = useState<string | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isMonoPasswordPromptOpen, setIsMonoPasswordPromptOpen] = useState(false);
  const [isMonoPasswordSetupOpen, setIsMonoPasswordSetupOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [isDiscardConfirmOpen, setIsDiscardConfirmOpen] = useState(false);
  const [selectedCredential, setSelectedCredential] = useState<Credential | null>(null);
  const [credentialToDelete, setCredentialToDelete] = useState<Credential | null>(null);
  const [nextStorageLocation, setNextStorageLocation] = useState<StorageLocation | null>(null);
  const [pendingAction, setPendingAction] = useState<{ 
    type: 'view' | 'copy' | 'load' | 'loadLocal', 
    field?: string, 
    value?: string, 
    credentialId?: string,
    file?: File 
  } | null>(null);
  const [visiblePasswords, setVisiblePasswords] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const [monoPasswordSetup, setMonoPasswordSetup] = useState('');
  const [confirmMonoPassword, setConfirmMonoPassword] = useState('');
  const [isSettingUpPassword, setIsSettingUpPassword] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isLocalFileActive, setIsLocalFileActive] = useState(false);

  console.log('Dashboard render - user:', user?.email, 'authLoading:', authLoading, 'monoPassword:', !!monoPassword);

  // Get current credentials based on storage location
  const getCurrentCredentials = () => {
    return storageLocation === 'local' ? localCredentials : credentials;
  };

  useEffect(() => {
    const currentCredentials = getCurrentCredentials();
    const filtered = currentCredentials.filter(cred =>
      cred.accountName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cred.username.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredCredentials(filtered);
  }, [searchTerm, credentials, localCredentials, storageLocation]);

  useEffect(() => {
    console.log('Dashboard useEffect - user:', user?.email, 'monoPassword:', !!monoPassword);
    
    // Don't proceed if auth is still loading
    if (authLoading) {
      console.log('Auth still loading, waiting...');
      return;
    }

    // Check if user needs to set up MonoPassword
    if (user && (!user.monoPasswordHash || user.monoPasswordHash === '')) {
      console.log('User needs to set up MonoPassword');
      setIsMonoPasswordSetupOpen(true);
    } else if (user && !monoPassword && storageLocation === 'saas') {
      // User has MonoPassword set up but not entered yet (only for Supabase)
      console.log('User needs to enter MonoPassword');
      setIsMonoPasswordPromptOpen(true);
    } else if (user && monoPassword && storageLocation === 'saas') {
      // MonoPassword is available, load credentials from Supabase
      console.log('Loading credentials from Supabase...');
      loadCredentials();
    }
  }, [user, monoPassword, authLoading, storageLocation]);

  // Auto-save local file when credentials change
  useEffect(() => {
    if (storageLocation === 'local' && isLocalFileActive && localCredentials.length > 0 && monoPassword && user) {
      // Auto-save to memory (update the file data in memory)
      // Don't trigger download automatically
      setHasUnsavedChanges(true);
      console.log('Local credentials updated, marking as unsaved');
    }
  }, [localCredentials, storageLocation, isLocalFileActive, monoPassword, user]);

  const loadCredentials = async () => {
    if (storageLocation === 'local') {
      // For local storage, credentials are already loaded when file is selected
      return;
    }

    if (!monoPassword) {
      console.log('No monoPassword available for loading credentials');
      return;
    }

    setIsLoading(true);
    try {
      console.log('Loading credentials from database...');
      const creds = await DatabaseService.getCredentials(monoPassword);
      console.log('Loaded', creds.length, 'credentials');
      setCredentials(creds);
    } catch (error: any) {
      console.error('Load credentials error:', error);
      toast.error('Failed to load credentials');
    } finally {
      setIsLoading(false);
    }
  };

  const handleMonoPasswordSetup = async () => {
    if (monoPasswordSetup !== confirmMonoPassword) {
      toast.error('MonoPasswords do not match');
      return;
    }

    if (monoPasswordSetup.length < 8) {
      toast.error('MonoPassword must be at least 8 characters');
      return;
    }

    setIsSettingUpPassword(true);
    
    try {
      console.log('Setting up MonoPassword...');
      const monoPasswordHash = CryptoUtils.hashPassword(monoPasswordSetup);
      
      // Update the hash in database
      await DatabaseService.updateMonoPasswordHash(monoPasswordHash);

      // Refresh user data to get updated profile
      await refreshUser();

      // Set the MonoPassword in context
      setMonoPassword(monoPasswordSetup);
      
      // Close the setup modal
      setIsMonoPasswordSetupOpen(false);
      
      // Clear the form
      setMonoPasswordSetup('');
      setConfirmMonoPassword('');
      
      toast.success('MonoPassword set up successfully!');
      console.log('MonoPassword setup completed');
    } catch (error: any) {
      console.error('MonoPassword setup error:', error);
      toast.error('Failed to set up MonoPassword');
    } finally {
      setIsSettingUpPassword(false);
    }
  };

  const handleSecureAction = (type: 'view' | 'copy', field: string, value: string, credentialId?: string) => {
    if (!monoPassword) {
      setPendingAction({ type, field, value, credentialId });
      setIsMonoPasswordPromptOpen(true);
      return;
    }

    executeSecureAction(type, field, value, credentialId);
  };

  const executeSecureAction = (type: 'view' | 'copy', field: string, value: string, credentialId?: string) => {
    if (type === 'copy') {
      navigator.clipboard.writeText(value);
      toast.success(`${field} copied to clipboard`);
    } else if (type === 'view' && credentialId) {
      setVisiblePasswords(prev => new Set([...prev, credentialId]));
      setTimeout(() => {
        setVisiblePasswords(prev => {
          const newSet = new Set(prev);
          newSet.delete(credentialId);
          return newSet;
        });
      }, 10000);
    }
  };

  const handleMonoPasswordVerified = async (password: string) => {
    console.log('MonoPassword verified, setting password...');
    setMonoPassword(password);
    setIsMonoPasswordPromptOpen(false);
    
    if (pendingAction) {
      if (pendingAction.type === 'load') {
        await loadCredentials();
      } else if (pendingAction.type === 'loadLocal' && pendingAction.file) {
        await loadLocalFile(pendingAction.file, password);
      } else {
        executeSecureAction(
          pendingAction.type as 'view' | 'copy', 
          pendingAction.field!, 
          pendingAction.value!, 
          pendingAction.credentialId
        );
      }
      setPendingAction(null);
    } else if (storageLocation === 'saas') {
      await loadCredentials();
    }
  };

  const handleSaveCredential = async (credentialData: Omit<Credential, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (!monoPassword && storageLocation !== 'local') {
      toast.error('MonoPassword required');
      return;
    }

    try {
      if (storageLocation === 'local') {
        // Handle local storage
        if (selectedCredential) {
          // Update existing credential
          const updatedCredentials = LocalStorageService.updateCredential(
            localCredentials, 
            selectedCredential.id, 
            credentialData
          );
          setLocalCredentials(updatedCredentials);
          toast.success('Credential updated successfully');
        } else {
          // Add new credential
          const updatedCredentials = LocalStorageService.addCredential(localCredentials, credentialData);
          setLocalCredentials(updatedCredentials);
          toast.success('Credential added successfully');
        }
        // Don't set unsaved changes here - let the useEffect handle it
      } else {
        // Handle Supabase storage
        if (selectedCredential) {
          await DatabaseService.updateCredential(selectedCredential.id, credentialData, monoPassword!);
          toast.success('Credential updated successfully');
        } else {
          await DatabaseService.saveCredential(credentialData, monoPassword!);
          toast.success('Credential saved successfully');
        }
        await loadCredentials();
      }

      setIsAddModalOpen(false);
      setIsEditModalOpen(false);
      setSelectedCredential(null);
    } catch (error: any) {
      toast.error(error.message || 'Failed to save credential');
    }
  };

  const handleDeleteCredential = (credential: Credential) => {
    setCredentialToDelete(credential);
    setIsDeleteConfirmOpen(true);
  };

  const confirmDeleteCredential = async () => {
    if (!credentialToDelete) return;

    try {
      if (storageLocation === 'local') {
        // Handle local storage
        const updatedCredentials = LocalStorageService.deleteCredential(localCredentials, credentialToDelete.id);
        setLocalCredentials(updatedCredentials);
        toast.success('Credential deleted successfully');
      } else {
        // Handle Supabase storage
        await DatabaseService.deleteCredential(credentialToDelete.id);
        toast.success('Credential deleted successfully');
        
        // Remove the deleted credential from state instead of reloading
        setCredentials(prev => prev.filter(cred => cred.id !== credentialToDelete.id));
      }
      
      setIsDeleteConfirmOpen(false);
      setCredentialToDelete(null);
    } catch (error: any) {
      toast.error('Failed to delete credential');
    }
  };

  // Helper function to finalize storage location switch
  const finalizeStorageSwitch = (newLocation: StorageLocation) => {
    setStorageLocation(newLocation);
    setHasUnsavedChanges(false);
    setSelectedLocalFile(null);
    setLocalFileName('');
    setLocalCredentials([]);
    setIsLocalFileActive(false);
    setFileOwnerInfo(null);

    // If switching to Supabase and user needs MonoPassword
    if (newLocation === 'saas' && user && !monoPassword) {
      setIsMonoPasswordPromptOpen(true);
    }
  };

  // Handle confirmation to discard changes and switch storage
  const handleConfirmDiscardAndSwitch = () => {
    if (nextStorageLocation) {
      finalizeStorageSwitch(nextStorageLocation);
      setIsDiscardConfirmOpen(false);
      setNextStorageLocation(null);
      toast.success(`Switched to ${getStorageDisplayName(nextStorageLocation)}`);
    }
  };

  // Get display name for storage location
  const getStorageDisplayName = (location: StorageLocation): string => {
    switch (location) {
      case 'saas': return 'Secure Cloud';
      case 'google-drive': return 'Google Drive';
      case 'onedrive': return 'OneDrive';
      case 'local': return 'Local Storage';
      default: return location;
    }
  };

  // Local file handling functions
  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!LocalStorageService.validateFileFormat(file)) {
      toast.error('Please select a valid MonoKey file (.monokey.json)');
      return;
    }

    if (!user) {
      toast.error('User authentication required');
      return;
    }

    // First verify file ownership without decrypting
    setIsLoading(true);
    try {
      const ownershipCheck = await LocalStorageService.verifyFileOwnership(file, user.id, user.email);
      
      if (!ownershipCheck.isValid) {
        toast.error(ownershipCheck.error || 'File ownership verification failed');
        if (ownershipCheck.fileOwner) {
          toast.error(`File belongs to: ${ownershipCheck.fileOwner}`, { duration: 6000 });
        }
        setIsLoading(false);
        return;
      }

      // File ownership verified, now prompt for MonoKey to decrypt
      setFileOwnerInfo(ownershipCheck.fileOwner || user.email);
      setPendingAction({ type: 'loadLocal', file });
      setIsMonoPasswordPromptOpen(true);
    } catch (error: any) {
      toast.error('Failed to verify file ownership');
      console.error('File ownership verification error:', error);
    } finally {
      setIsLoading(false);
    }

    // Clear the input
    event.target.value = '';
  };

  const loadLocalFile = async (file: File, password: string) => {
    if (!user) {
      toast.error('User authentication required');
      return;
    }

    setIsLoading(true);
    try {
      const loadedCredentials = await LocalStorageService.readLocalFile(
        file, 
        password, 
        user.id, 
        user.email
      );
      setLocalCredentials(loadedCredentials);
      setSelectedLocalFile(file);
      setLocalFileName(file.name);
      setIsLocalFileActive(true);
      setHasUnsavedChanges(false);
      toast.success(`Loaded ${loadedCredentials.length} credentials from ${file.name}`);
    } catch (error: any) {
      console.error('Load local file error:', error);
      toast.error(error.message || 'Failed to load local file');
      setSelectedLocalFile(null);
      setLocalFileName('');
      setFileOwnerInfo(null);
      setIsLocalFileActive(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateNewFile = () => {
    if (!monoPassword) {
      toast.error('MonoPassword required to create new file');
      return;
    }

    if (!user) {
      toast.error('User authentication required');
      return;
    }

    // Create a new empty local file session (don't download immediately)
    setSelectedLocalFile(null);
    setLocalCredentials([]);
    setLocalFileName('New MonoKey File');
    setIsLocalFileActive(true);
    setHasUnsavedChanges(false);
    setFileOwnerInfo(`${user.firstName} ${user.lastName}`);
    
    toast.success('New MonoKey file session created. Add credentials and save when ready.');
  };

  const handleSaveLocalFile = () => {
    if (!monoPassword) {
      toast.error('MonoPassword required to save file');
      return;
    }

    if (!user) {
      toast.error('User authentication required');
      return;
    }

    try {
      // Generate filename based on current state
      const timestamp = new Date().toISOString().split('T')[0];
      const filename = selectedLocalFile 
        ? selectedLocalFile.name 
        : `monokey-credentials-${timestamp}.monokey.json`;

      LocalStorageService.downloadLocalFile(
        localCredentials, 
        monoPassword, 
        user.id, 
        user.email, 
        `${user.firstName} ${user.lastName}`,
        filename
      );
      setHasUnsavedChanges(false);
      toast.success('File saved successfully');
    } catch (error: any) {
      toast.error('Failed to save file');
    }
  };

  const handleRemoveSelectedFile = () => {
    if (hasUnsavedChanges) {
      if (!confirm('You have unsaved changes. Are you sure you want to remove this file?')) {
        return;
      }
    }
    
    setSelectedLocalFile(null);
    setLocalFileName('');
    setLocalCredentials([]);
    setIsLocalFileActive(false);
    setHasUnsavedChanges(false);
    setFileOwnerInfo(null);
    toast.success('File removed from session');
  };

  const handleStorageLocationChange = (newLocation: StorageLocation) => {
    // Check if switching from local storage with unsaved changes
    if (storageLocation === 'local' && hasUnsavedChanges && newLocation !== 'local') {
      // Show confirmation modal instead of direct confirm dialog
      setNextStorageLocation(newLocation);
      setIsDiscardConfirmOpen(true);
      return;
    }

    // Direct switch if no unsaved changes or not switching from local
    finalizeStorageSwitch(newLocation);
  };

  const storageOptions = [
    { value: 'saas', label: 'Secure Cloud', icon: <Cloud className="w-4 h-4" />, description: 'Encrypted cloud storage' },
    { value: 'google-drive', label: 'Google Drive', icon: <div className="w-4 h-4 bg-red-500 rounded text-white text-xs flex items-center justify-center">G</div>, description: 'Sync with Google Drive' },
    { value: 'onedrive', label: 'OneDrive', icon: <div className="w-4 h-4 bg-blue-600 rounded text-white text-xs flex items-center justify-center">O</div>, description: 'Microsoft OneDrive' },
    { value: 'local', label: 'Local Storage', icon: <HardDrive className="w-4 h-4" />, description: 'Local JSON files' }
  ];

  // Show loading if auth is still loading
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  // Show error if no user
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-gray-900">
        <div className="text-center">
          <p className="text-gray-600 dark:text-gray-400">User not found. Please sign in again.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen transition-colors ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Welcome back, {user?.firstName}
              </h1>
              <p className={`mt-1 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                Manage your secure credentials with complete control
              </p>
            </div>
            <div className="mt-4 sm:mt-0 flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Shield className="w-5 h-5 text-green-500" />
                <span className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                  {getCurrentCredentials().length} credentials secured
                </span>
              </div>
              <Button
                onClick={toggleTheme}
                variant="outline"
                size="sm"
                className={isDark ? 'border-gray-600 text-gray-300 hover:bg-gray-800' : ''}
              >
                {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </Button>
              {storageLocation === 'saas' && (
                <Button
                  onClick={loadCredentials}
                  variant="outline"
                  size="sm"
                  isLoading={isLoading}
                  className={isDark ? 'border-gray-600 text-gray-300 hover:bg-gray-800' : ''}
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Refresh
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Storage Location Selector */}
        <div className={`rounded-lg shadow-sm border p-6 mb-6 ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
          <div className="flex items-center justify-between mb-4">
            <h2 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>Storage Location</h2>
            <Database className={`w-5 h-5 ${isDark ? 'text-gray-400' : 'text-gray-400'}`} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            {storageOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => handleStorageLocationChange(option.value as StorageLocation)}
                className={`p-4 rounded-lg border-2 transition-all text-left ${
                  storageLocation === option.value
                    ? 'border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300'
                    : `border-gray-200 hover:border-gray-300 ${isDark ? 'border-gray-600 hover:border-gray-500 text-gray-300' : ''}`
                }`}
              >
                <div className="flex items-center space-x-3 mb-2">
                  {option.icon}
                  <span className="font-medium">{option.label}</span>
                </div>
                <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{option.description}</p>
              </button>
            ))}
          </div>

          {/* Local Storage Controls */}
          {storageLocation === 'local' && (
            <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
              <div className="flex flex-col space-y-4">
                {/* File Selection Row */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
                  <div className="flex items-center space-x-4">
                    <input
                      type="file"
                      accept=".json,.monokey.json"
                      onChange={handleFileSelect}
                      className="hidden"
                      id="file-input"
                      disabled={isLocalFileActive}
                    />
                    <label
                      htmlFor="file-input"
                      className={`flex items-center px-4 py-2 border rounded-lg transition-colors ${
                        isLocalFileActive
                          ? 'opacity-50 cursor-not-allowed border-gray-300 text-gray-400'
                          : isDark 
                            ? 'border-gray-600 text-gray-300 hover:bg-gray-700 cursor-pointer' 
                            : 'border-gray-300 text-gray-700 hover:bg-gray-50 cursor-pointer'
                      }`}
                    >
                      <FolderOpen className="w-4 h-4 mr-2" />
                      Select Existing File
                    </label>
                    <Button
                      variant="outline"
                      onClick={handleCreateNewFile}
                      disabled={!monoPassword || isLocalFileActive}
                      className={`${isDark ? 'border-gray-600 text-gray-300 hover:bg-gray-700' : ''} ${
                        (!monoPassword || isLocalFileActive) ? 'opacity-50 cursor-not-allowed' : ''
                      }`}
                    >
                      <FileText className="w-4 h-4 mr-2" />
                      Create New File
                    </Button>
                  </div>

                  <div className="flex items-center space-x-4">
                    {hasUnsavedChanges && (
                      <div className="flex items-center space-x-2 text-yellow-600 dark:text-yellow-400">
                        <Save className="w-4 h-4" />
                        <span className="text-sm font-medium">Auto-saved in memory</span>
                      </div>
                    )}
                    <Button
                      onClick={handleSaveLocalFile}
                      disabled={!isLocalFileActive || !monoPassword}
                      className="flex items-center"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Download File
                    </Button>
                  </div>
                </div>

                {/* File Status Row */}
                {(isLocalFileActive || fileOwnerInfo) && (
                  <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <FileText className={`w-4 h-4 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
                      <span className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                        {localFileName || 'Active File Session'}
                      </span>
                      {fileOwnerInfo && (
                        <div className="flex items-center space-x-2">
                          <UserCheck className="w-4 h-4 text-green-500" />
                          <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                            Owner: {fileOwnerInfo}
                          </span>
                        </div>
                      )}
                      {hasUnsavedChanges && (
                        <span className="text-sm text-yellow-600 dark:text-yellow-400 font-medium">
                          • {localCredentials.length} credentials in memory
                        </span>
                      )}
                    </div>
                    <button
                      onClick={handleRemoveSelectedFile}
                      className={`p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors ${
                        isDark ? 'text-gray-400 hover:text-gray-300' : 'text-gray-500 hover:text-gray-700'
                      }`}
                      title="Remove file from session"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}

                {/* Help Text */}
                {storageLocation === 'local' && !isLocalFileActive && (
                  <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    <p>
                      <strong>Local Storage:</strong> Select an existing MonoKey file to load your credentials, 
                      or create a new file to start fresh. All data is encrypted with your MonoKey and stored locally.
                    </p>
                    <p className="mt-2">
                      <strong>Auto-Save:</strong> When you add or modify credentials, they're automatically saved in memory. 
                      Click "Download File\" to save them to your device.
                    </p>
                    <p className="mt-2">
                      <strong>Security:</strong> Files are protected with ownership verification - you can only access files created with your account.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 space-y-4 sm:space-y-0">
          <div className="flex-1 max-w-md">
            <div className="relative">
              <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 ${isDark ? 'text-gray-400' : 'text-gray-400'}`} />
              <input
                type="text"
                placeholder="Search credentials..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  isDark 
                    ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-400' 
                    : 'bg-white border-gray-300 text-gray-900'
                }`}
              />
            </div>
          </div>
          <div className="flex space-x-3">
            <Button
              onClick={() => setIsAddModalOpen(true)}
              disabled={storageLocation === 'local' && !isLocalFileActive}
              className="flex items-center"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Credential
            </Button>
          </div>
        </div>

        {/* Credentials Table */}
        <div className={`rounded-lg shadow-sm border overflow-hidden ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className={`ml-3 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>Loading credentials...</span>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className={isDark ? 'bg-gray-700' : 'bg-gray-50'}>
                  <tr>
                    <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDark ? 'text-gray-300' : 'text-gray-500'}`}>
                      Account
                    </th>
                    <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDark ? 'text-gray-300' : 'text-gray-500'}`}>
                      Username
                    </th>
                    <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDark ? 'text-gray-300' : 'text-gray-500'}`}>
                      Password
                    </th>
                    <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDark ? 'text-gray-300' : 'text-gray-500'}`}>
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${isDark ? 'bg-gray-800 divide-gray-700' : 'bg-white divide-gray-200'}`}>
                  {filteredCredentials.map((credential) => (
                    <motion.tr
                      key={credential.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className={`hover:${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {credential.icon?.startsWith('data:') ? (
                            <img src={credential.icon} alt="Icon" className="w-8 h-8 mr-3 rounded" />
                          ) : (
                            <span className="text-2xl mr-3">{credential.icon}</span>
                          )}
                          <div>
                            <div className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                              {credential.accountName}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-2">
                          <span className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-900'}`}>{credential.username}</span>
                          <button
                            onClick={() => handleSecureAction('copy', 'Username', credential.username)}
                            className={`hover:text-blue-600 transition-colors ${isDark ? 'text-gray-400' : 'text-gray-400'}`}
                          >
                            <Copy className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-2">
                          <span className={`text-sm font-mono ${isDark ? 'text-gray-300' : 'text-gray-900'}`}>
                            {visiblePasswords.has(credential.id) ? credential.password : '••••••••'}
                          </span>
                          <button
                            onClick={() => handleSecureAction('view', 'Password', credential.password, credential.id)}
                            className={`hover:text-blue-600 transition-colors ${isDark ? 'text-gray-400' : 'text-gray-400'}`}
                          >
                            {visiblePasswords.has(credential.id) ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                          <button
                            onClick={() => handleSecureAction('copy', 'Password', credential.password)}
                            className={`hover:text-blue-600 transition-colors ${isDark ? 'text-gray-400' : 'text-gray-400'}`}
                          >
                            <Copy className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => {
                              setSelectedCredential(credential);
                              setIsEditModalOpen(true);
                            }}
                            className="text-blue-600 hover:text-blue-900 transition-colors"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteCredential(credential)}
                            className="text-red-600 hover:text-red-900 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {filteredCredentials.length === 0 && !isLoading && (
          <div className="text-center py-12">
            <Shield className={`w-12 h-12 mx-auto mb-4 ${isDark ? 'text-gray-400' : 'text-gray-400'}`} />
            <h3 className={`text-lg font-medium mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>No credentials found</h3>
            <p className={`mb-4 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
              {searchTerm ? 'Try adjusting your search terms' : 
               storageLocation === 'local' ? 'Select a file or create a new one to get started' :
               'Get started by adding your first credential'}
            </p>
            {!searchTerm && (storageLocation !== 'local' || isLocalFileActive) && (
              <Button onClick={() => setIsAddModalOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Add Your First Credential
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <Modal 
        isOpen={isDeleteConfirmOpen} 
        onClose={() => setIsDeleteConfirmOpen(false)} 
        title="Delete Credential"
      >
        <div className="space-y-6">
          <div className="text-center">
            <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-8 h-8 text-red-600 dark:text-red-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Are you sure?
            </h3>
            <p className="text-gray-600 dark:text-gray-300">
              This will permanently delete the credential for{' '}
              <strong>{credentialToDelete?.accountName}</strong>. This action cannot be undone.
            </p>
          </div>

          <div className="flex space-x-3">
            <Button
              variant="outline"
              onClick={() => setIsDeleteConfirmOpen(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={confirmDeleteCredential}
              className="flex-1"
            >
              Delete Credential
            </Button>
          </div>
        </div>
      </Modal>

      {/* Storage Switch Confirmation Modal */}
      <Modal 
        isOpen={isDiscardConfirmOpen} 
        onClose={() => {
          setIsDiscardConfirmOpen(false);
          setNextStorageLocation(null);
        }} 
        title="Switch Storage Location"
      >
        <div className="space-y-6">
          <div className="text-center">
            <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Database className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Switch to {nextStorageLocation ? getStorageDisplayName(nextStorageLocation) : 'Online Storage'}?
            </h3>
            <p className="text-gray-600 dark:text-gray-300">
              You have unsaved changes in your current local file. Switching storage locations will discard these changes.
            </p>
          </div>

          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg p-4">
            <p className="text-sm text-yellow-800 dark:text-yellow-200">
              <strong>Note:</strong> If you want to keep your local changes, download the file first before switching.
            </p>
          </div>

          <div className="flex space-x-3">
            <Button
              variant="outline"
              onClick={() => {
                setIsDiscardConfirmOpen(false);
                setNextStorageLocation(null);
              }}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirmDiscardAndSwitch}
              className="flex-1"
            >
              Switch Anyway
            </Button>
          </div>
        </div>
      </Modal>

      {/* MonoPassword Setup Modal */}
      <Modal 
        isOpen={isMonoPasswordSetupOpen} 
        onClose={() => {}} 
        title="Set Up Your MonoPassword"
      >
        <div className="space-y-6">
          <div className="text-center">
            <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Shield className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Create Your Master Key
            </h3>
            <p className="text-gray-600 dark:text-gray-300">
              Your MonoPassword is the master key that encrypts all your credentials. 
              Choose something secure that you'll remember.
            </p>
          </div>

          <div className="space-y-4">
            <Input
              label="MonoPassword"
              type="password"
              value={monoPasswordSetup}
              onChange={(e) => setMonoPasswordSetup(e.target.value)}
              placeholder="Enter your MonoPassword"
              showPasswordToggle
              required
            />

            <Input
              label="Confirm MonoPassword"
              type="password"
              value={confirmMonoPassword}
              onChange={(e) => setConfirmMonoPassword(e.target.value)}
              placeholder="Confirm your MonoPassword"
              showPasswordToggle
              required
            />
          </div>

          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg p-4">
            <p className="text-sm text-yellow-800 dark:text-yellow-200">
              <strong>Important:</strong> Your MonoPassword cannot be recovered if lost. 
              Please store it securely and remember it.
            </p>
          </div>

          <Button
            onClick={handleMonoPasswordSetup}
            className="w-full"
            disabled={!monoPasswordSetup || !confirmMonoPassword || isSettingUpPassword}
            isLoading={isSettingUpPassword}
          >
            Set Up MonoPassword
          </Button>
        </div>
      </Modal>

      {/* Other Modals */}
      <MonoPasswordPrompt
        isOpen={isMonoPasswordPromptOpen}
        onClose={() => setIsMonoPasswordPromptOpen(false)}
        onVerified={handleMonoPasswordVerified}
      />

      <CredentialForm
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setSelectedCredential(null);
        }}
        onSave={handleSaveCredential}
      />

      <CredentialForm
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedCredential(null);
        }}
        onSave={handleSaveCredential}
        credential={selectedCredential}
        isEditing={true}
      />
    </div>
  );
};

export default Dashboard;