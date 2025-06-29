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
  RefreshCw
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { DatabaseService } from '../utils/database';
import { Credential, StorageLocation } from '../types';
import Button from '../components/UI/Button';
import CredentialForm from '../components/CredentialForm';
import MonoPasswordPrompt from '../components/MonoPasswordPrompt';
import toast from 'react-hot-toast';

const Dashboard: React.FC = () => {
  const { user, monoPassword, setMonoPassword } = useAuth();
  const [credentials, setCredentials] = useState<Credential[]>([]);
  const [filteredCredentials, setFilteredCredentials] = useState<Credential[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [storageLocation, setStorageLocation] = useState<StorageLocation>('saas');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isMonoPasswordPromptOpen, setIsMonoPasswordPromptOpen] = useState(false);
  const [selectedCredential, setSelectedCredential] = useState<Credential | null>(null);
  const [pendingAction, setPendingAction] = useState<{ type: 'view' | 'copy' | 'load', field?: string, value?: string, credentialId?: string } | null>(null);
  const [visiblePasswords, setVisiblePasswords] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const filtered = credentials.filter(cred =>
      cred.accountName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cred.username.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredCredentials(filtered);
  }, [searchTerm, credentials]);

  useEffect(() => {
    if (monoPassword) {
      loadCredentials();
    }
  }, [monoPassword]);

  const loadCredentials = async () => {
    if (!monoPassword) {
      setPendingAction({ type: 'load' });
      setIsMonoPasswordPromptOpen(true);
      return;
    }

    setIsLoading(true);
    try {
      const creds = await DatabaseService.getCredentials(monoPassword);
      setCredentials(creds);
    } catch (error: any) {
      toast.error('Failed to load credentials');
      console.error('Load credentials error:', error);
    } finally {
      setIsLoading(false);
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
      }, 10000); // Hide after 10 seconds
    }
  };

  const handleMonoPasswordVerified = async (password: string) => {
    setMonoPassword(password);
    setIsMonoPasswordPromptOpen(false);
    
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
    if (!monoPassword) {
      toast.error('MonoPassword required');
      return;
    }

    try {
      if (selectedCredential) {
        // Update existing credential
        await DatabaseService.updateCredential(selectedCredential.id, credentialData, monoPassword);
        toast.success('Credential updated successfully');
      } else {
        // Create new credential
        await DatabaseService.saveCredential(credentialData, monoPassword);
        toast.success('Credential saved successfully');
      }

      await loadCredentials();
      setIsAddModalOpen(false);
      setIsEditModalOpen(false);
      setSelectedCredential(null);
    } catch (error: any) {
      toast.error(error.message || 'Failed to save credential');
    }
  };

  const handleDeleteCredential = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this credential?')) {
      try {
        await DatabaseService.deleteCredential(id);
        await loadCredentials();
        toast.success('Credential deleted successfully');
      } catch (error: any) {
        toast.error('Failed to delete credential');
      }
    }
  };

  const storageOptions = [
    { value: 'saas', label: 'Secure Cloud', icon: <Cloud className="w-4 h-4" />, description: 'Encrypted cloud storage' },
    { value: 'google-drive', label: 'Google Drive', icon: <div className="w-4 h-4 bg-red-500 rounded text-white text-xs flex items-center justify-center">G</div>, description: 'Sync with Google Drive' },
    { value: 'onedrive', label: 'OneDrive', icon: <div className="w-4 h-4 bg-blue-600 rounded text-white text-xs flex items-center justify-center">O</div>, description: 'Microsoft OneDrive' },
    { value: 'local', label: 'Local Storage', icon: <HardDrive className="w-4 h-4" />, description: 'Browser local storage' }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Welcome back, {user?.firstName}
              </h1>
              <p className="text-gray-600 mt-1">
                Manage your secure credentials with complete control
              </p>
            </div>
            <div className="mt-4 sm:mt-0 flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Shield className="w-5 h-5 text-green-500" />
                <span className="text-sm text-gray-600">
                  {credentials.length} credentials secured
                </span>
              </div>
              <Button
                onClick={loadCredentials}
                variant="outline"
                size="sm"
                isLoading={isLoading}
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
            </div>
          </div>
        </div>

        {/* Storage Location Selector */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Storage Location</h2>
            <Database className="w-5 h-5 text-gray-400" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            {storageOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => setStorageLocation(option.value as StorageLocation)}
                className={`p-4 rounded-lg border-2 transition-all text-left ${
                  storageLocation === option.value
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center space-x-3 mb-2">
                  {option.icon}
                  <span className="font-medium">{option.label}</span>
                </div>
                <p className="text-sm text-gray-600">{option.description}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 space-y-4 sm:space-y-0">
          <div className="flex-1 max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search credentials..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
          <div className="flex space-x-3">
            <Button
              onClick={() => setIsAddModalOpen(true)}
              className="flex items-center"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Credential
            </Button>
          </div>
        </div>

        {/* Credentials Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-3 text-gray-600">Loading credentials...</span>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Account
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Username
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Password
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredCredentials.map((credential) => (
                    <motion.tr
                      key={credential.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="hover:bg-gray-50"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <span className="text-2xl mr-3">{credential.icon}</span>
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {credential.accountName}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-2">
                          <span className="text-sm text-gray-900">{credential.username}</span>
                          <button
                            onClick={() => handleSecureAction('copy', 'Username', credential.username)}
                            className="text-gray-400 hover:text-blue-600 transition-colors"
                          >
                            <Copy className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-2">
                          <span className="text-sm text-gray-900 font-mono">
                            {visiblePasswords.has(credential.id) ? credential.password : '••••••••'}
                          </span>
                          <button
                            onClick={() => handleSecureAction('view', 'Password', credential.password, credential.id)}
                            className="text-gray-400 hover:text-blue-600 transition-colors"
                          >
                            {visiblePasswords.has(credential.id) ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                          <button
                            onClick={() => handleSecureAction('copy', 'Password', credential.password)}
                            className="text-gray-400 hover:text-blue-600 transition-colors"
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
                            onClick={() => handleDeleteCredential(credential.id)}
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
            <Shield className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No credentials found</h3>
            <p className="text-gray-600 mb-4">
              {searchTerm ? 'Try adjusting your search terms' : 'Get started by adding your first credential'}
            </p>
            {!searchTerm && (
              <Button onClick={() => setIsAddModalOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Add Your First Credential
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Modals */}
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