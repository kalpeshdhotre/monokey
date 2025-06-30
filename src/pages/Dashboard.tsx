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
  RefreshCw,
  Sun,
  Moon,
  AlertTriangle
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useCredentials } from '../contexts/CredentialContext';
import { useTheme } from '../contexts/ThemeContext';
import { CryptoUtils } from '../utils/crypto';
import { Credential } from '../types';
import Button from '../components/UI/Button';
import Input from '../components/UI/Input';
import Modal from '../components/UI/Modal';
import CredentialForm from '../components/CredentialForm';
import MonoKeyPrompt from '../components/MonoPasswordPrompt';
import toast from 'react-hot-toast';

const Dashboard: React.FC = () => {
  const { user, monoKey, setMonoKey, verifyMonoKey, isInitialLoading, refreshUser } = useAuth();
  const { 
    credentials, 
    isLoadingCredentials, 
    hasLoadedCredentials,
    addCredential, 
    updateCredential, 
    removeCredential, 
    loadCredentials 
  } = useCredentials();
  const { isDark, toggleTheme } = useTheme();
  
  const [filteredCredentials, setFilteredCredentials] = useState<Credential[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isMonoKeyPromptOpen, setIsMonoKeyPromptOpen] = useState(false);
  const [isMonoKeySetupOpen, setIsMonoKeySetupOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [selectedCredential, setSelectedCredential] = useState<Credential | null>(null);
  const [credentialToDelete, setCredentialToDelete] = useState<Credential | null>(null);
  const [pendingAction, setPendingAction] = useState<{ 
    type: 'view' | 'copy' | 'load', 
    field?: string, 
    value?: string, 
    credentialId?: string
  } | null>(null);
  const [visiblePasswords, setVisiblePasswords] = useState<Set<string>>(new Set());
  const [monoKeySetup, setMonoKeySetup] = useState('');
  const [confirmMonoKey, setConfirmMonoKey] = useState('');
  const [isSettingUpKey, setIsSettingUpKey] = useState(false);

  console.log('Dashboard render - user:', user?.email, 'monoKey:', !!monoKey, 'credentials:', credentials.length, 'hasLoaded:', hasLoadedCredentials, 'isLoading:', isLoadingCredentials);

  // Filter credentials based on search term
  useEffect(() => {
    const filtered = credentials.filter(cred =>
      cred.accountName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cred.username.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredCredentials(filtered);
  }, [searchTerm, credentials]);

  // Handle MonoKey setup flow
  useEffect(() => {
    if (isInitialLoading || !user) {
      return;
    }

    // Check if user needs to set up MonoKey
    if (!user.monoPasswordHash || user.monoPasswordHash === '') {
      console.log('User needs to set up MonoKey');
      setIsMonoKeySetupOpen(true);
    } else if (!monoKey && !isMonoKeySetupOpen) {
      // User has MonoKey set up but not entered yet
      console.log('User needs to enter MonoKey');
      setIsMonoKeyPromptOpen(true);
    }
  }, [user, monoKey, isInitialLoading, isMonoKeySetupOpen]);

  const handleMonoKeySetup = async () => {
    if (monoKeySetup !== confirmMonoKey) {
      toast.error('MonoKeys do not match');
      return;
    }

    if (monoKeySetup.length < 8) {
      toast.error('MonoKey must be at least 8 characters');
      return;
    }

    setIsSettingUpKey(true);
    
    try {
      console.log('Setting up MonoKey...');
      const monoKeyHash = CryptoUtils.hashPassword(monoKeySetup);
      
      const { DatabaseService } = await import('../utils/database');
      await DatabaseService.updateMonoPasswordHash(monoKeyHash);

      await refreshUser();
      setMonoKey(monoKeySetup);
      setIsMonoKeySetupOpen(false);
      setMonoKeySetup('');
      setConfirmMonoKey('');
      
      toast.success('MonoKey set up successfully!');
    } catch (error: any) {
      console.error('MonoKey setup error:', error);
      toast.error('Failed to set up MonoKey');
    } finally {
      setIsSettingUpKey(false);
    }
  };

  const handleSecureAction = (type: 'view' | 'copy', field: string, value: string, credentialId?: string) => {
    if (!monoKey) {
      setPendingAction({ type, field, value, credentialId });
      setIsMonoKeyPromptOpen(true);
      return;
    }

    executeSecureAction(type, field, value, credentialId);
  };

  const executeSecureAction = (type: 'view' | 'copy', field: string, value: string, credentialId?: string) => {
    if (type === 'copy') {
      navigator.clipboard.writeText(value);
      toast.success(`${field} copied to clipboard`);
    } else if (type === 'view' && credentialId) {
      setVisiblePasswords(prev => {
        const newSet = new Set(prev);
        if (newSet.has(credentialId)) {
          newSet.delete(credentialId);
        } else {
          newSet.add(credentialId);
          setTimeout(() => {
            setVisiblePasswords(current => {
              const updatedSet = new Set(current);
              updatedSet.delete(credentialId);
              return updatedSet;
            });
          }, 10000);
        }
        return newSet;
      });
    }
  };

  const handleMonoKeyVerified = async (key: string) => {
    console.log('MonoKey verified, setting key...');
    setMonoKey(key);
    setIsMonoKeyPromptOpen(false);
    
    if (pendingAction) {
      if (pendingAction.type === 'load') {
        await loadCredentials();
      } else {
        executeSecureAction(
          pendingAction.type as 'view' | 'copy', 
          pendingAction.field!, 
          pendingAction.value!, 
          pendingAction.credentialId
        );
      }
      setPendingAction(null);
    }
  };

  const handleSaveCredential = async (credentialData: Omit<Credential, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (!monoKey) {
      toast.error('MonoKey required');
      return;
    }

    try {
      if (selectedCredential) {
        await updateCredential(selectedCredential.id, credentialData);
        toast.success('Credential updated successfully');
      } else {
        await addCredential(credentialData);
        toast.success('Credential saved successfully');
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
      await removeCredential(credentialToDelete.id);
      toast.success('Credential deleted successfully');
      setIsDeleteConfirmOpen(false);
      setCredentialToDelete(null);
    } catch (error: any) {
      toast.error('Failed to delete credential');
    }
  };

  // Show loading only during initial auth check
  if (isInitialLoading) {
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

  // Always show the dashboard UI structure - this is the key fix
  return (
    <div className={`min-h-screen transition-colors ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header - Always visible */}
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
                  {credentials.length} credentials secured
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
              <Button
                onClick={loadCredentials}
                variant="outline"
                size="sm"
                isLoading={isLoadingCredentials}
                disabled={!monoKey}
                className={isDark ? 'border-gray-600 text-gray-300 hover:bg-gray-800' : ''}
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
            </div>
          </div>
        </div>

        {/* Controls - Always visible */}
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
              onClick={() => {
                if (!monoKey) {
                  setIsMonoKeyPromptOpen(true);
                  return;
                }
                setIsAddModalOpen(true);
              }}
              className="flex items-center"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Credential
            </Button>
          </div>
        </div>

        {/* Show message if MonoKey is not available */}
        {!monoKey && !isMonoKeySetupOpen && (
          <div className={`rounded-lg border p-6 mb-6 ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
            <div className="text-center">
              <Shield className={`w-12 h-12 mx-auto mb-4 ${isDark ? 'text-gray-400' : 'text-gray-400'}`} />
              <h3 className={`text-lg font-medium mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                MonoKey Required
              </h3>
              <p className={`mb-4 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                Please enter your MonoKey to access your secure credentials.
              </p>
              <Button onClick={() => setIsMonoKeyPromptOpen(true)}>
                Enter MonoKey
              </Button>
            </div>
          </div>
        )}

        {/* Credentials Table - Always show structure when MonoKey is available */}
        {monoKey && (
          <div className={`rounded-lg shadow-sm border overflow-hidden ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
            {/* Show loading indicator only on first load or when explicitly refreshing */}
            {isLoadingCredentials && !hasLoadedCredentials ? (
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
                    {/* Show credentials if available */}
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
                            <div className="min-w-0 flex-1">
                              <span className={`text-sm font-mono block truncate ${isDark ? 'text-gray-300' : 'text-gray-900'}`} style={{ minWidth: '120px', maxWidth: '200px' }}>
                                {visiblePasswords.has(credential.id) ? credential.password : '••••••••••••'}
                              </span>
                            </div>
                            <div className="flex items-center space-x-1 flex-shrink-0">
                              <button
                                onClick={() => handleSecureAction('view', 'Password', credential.password, credential.id)}
                                className={`hover:text-blue-600 transition-colors ${isDark ? 'text-gray-400' : 'text-gray-400'}`}
                                title={visiblePasswords.has(credential.id) ? 'Hide password' : 'Show password'}
                              >
                                {visiblePasswords.has(credential.id) ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                              </button>
                              <button
                                onClick={() => handleSecureAction('copy', 'Password', credential.password)}
                                className={`hover:text-blue-600 transition-colors ${isDark ? 'text-gray-400' : 'text-gray-400'}`}
                                title="Copy password"
                              >
                                <Copy className="w-4 h-4" />
                              </button>
                            </div>
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
                              title="Edit credential"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteCredential(credential)}
                              className="text-red-600 hover:text-red-900 transition-colors"
                              title="Delete credential"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </motion.tr>
                    ))}
                    
                    {/* Show empty state only when no credentials and has loaded */}
                    {filteredCredentials.length === 0 && hasLoadedCredentials && (
                      <tr>
                        <td colSpan={4} className="px-6 py-12 text-center">
                          <Shield className={`w-12 h-12 mx-auto mb-4 ${isDark ? 'text-gray-400' : 'text-gray-400'}`} />
                          <h3 className={`text-lg font-medium mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                            {searchTerm ? 'No matching credentials' : 'No credentials found'}
                          </h3>
                          <p className={`mb-4 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                            {searchTerm ? 'Try adjusting your search terms' : 'Get started by adding your first credential'}
                          </p>
                          {!searchTerm && (
                            <Button onClick={() => setIsAddModalOpen(true)}>
                              <Plus className="w-4 h-4 mr-2" />
                              Add Your First Credential
                            </Button>
                          )}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {/* All Modals */}
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

      <Modal 
        isOpen={isMonoKeySetupOpen} 
        onClose={() => {}} 
        title="Set Up Your MonoKey"
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
              Your MonoKey is the master key that encrypts all your credentials. 
              Choose something secure that you'll remember.
            </p>
          </div>

          <div className="space-y-4">
            <Input
              label="MonoKey"
              type="password"
              value={monoKeySetup}
              onChange={(e) => setMonoKeySetup(e.target.value)}
              placeholder="Enter your MonoKey"
              showPasswordToggle
              required
            />

            <Input
              label="Confirm MonoKey"
              type="password"
              value={confirmMonoKey}
              onChange={(e) => setConfirmMonoKey(e.target.value)}
              placeholder="Confirm your MonoKey"
              showPasswordToggle
              required
            />
          </div>

          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg p-4">
            <p className="text-sm text-yellow-800 dark:text-yellow-200">
              <strong>Important:</strong> Your MonoKey cannot be recovered if lost. 
              Please store it securely and remember it.
            </p>
          </div>

          <Button
            onClick={handleMonoKeySetup}
            className="w-full"
            disabled={!monoKeySetup || !confirmMonoKey || isSettingUpKey}
            isLoading={isSettingUpKey}
          >
            Set Up MonoKey
          </Button>
        </div>
      </Modal>

      <MonoKeyPrompt
        isOpen={isMonoKeyPromptOpen}
        onClose={() => setIsMonoKeyPromptOpen(false)}
        onVerified={handleMonoKeyVerified}
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