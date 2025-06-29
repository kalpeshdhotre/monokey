import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  User, 
  Shield, 
  Database, 
  ArrowLeft, 
  Save,
  Key,
  Mail,
  Phone
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { DatabaseService } from '../utils/database';
import { CryptoUtils } from '../utils/crypto';
import Button from '../components/UI/Button';
import Input from '../components/UI/Input';
import Modal from '../components/UI/Modal';
import toast from 'react-hot-toast';

const Settings: React.FC = () => {
  const { user, verifyMonoPassword } = useAuth();
  const { isDark } = useTheme();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  const [userSettings, setUserSettings] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    phoneNumber: user?.phoneNumber || ''
  });
  const [passwordChange, setPasswordChange] = useState({
    currentMonoPassword: '',
    newMonoPassword: '',
    confirmNewMonoPassword: ''
  });

  useEffect(() => {
    if (user) {
      setUserSettings({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        phoneNumber: user.phoneNumber || ''
      });
    }
  }, [user]);

  const handleUpdateProfile = async () => {
    setIsLoading(true);
    try {
      await DatabaseService.updateUserProfile(userSettings);
      toast.success('Profile updated successfully');
      
      // Navigate back to dashboard after successful update
      setTimeout(() => {
        navigate('/dashboard');
      }, 1000);
    } catch (error: any) {
      toast.error('Failed to update profile');
      console.error('Profile update error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleChangeMonoPassword = async () => {
    if (passwordChange.newMonoPassword !== passwordChange.confirmNewMonoPassword) {
      toast.error('New MonoPasswords do not match');
      return;
    }

    if (passwordChange.newMonoPassword.length < 8) {
      toast.error('MonoPassword must be at least 8 characters');
      return;
    }

    if (!verifyMonoPassword(passwordChange.currentMonoPassword)) {
      toast.error('Current MonoPassword is incorrect');
      return;
    }

    try {
      const newMonoPasswordHash = CryptoUtils.hashPassword(passwordChange.newMonoPassword);
      await DatabaseService.updateMonoPasswordHash(newMonoPasswordHash);
      
      toast.success('MonoPassword updated successfully');
      setIsChangePasswordOpen(false);
      setPasswordChange({
        currentMonoPassword: '',
        newMonoPassword: '',
        confirmNewMonoPassword: ''
      });
    } catch (error: any) {
      toast.error('Failed to update MonoPassword');
    }
  };

  return (
    <div className={`min-h-screen transition-colors ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-4 mb-4">
            <Button
              variant="outline"
              onClick={() => navigate('/dashboard')}
              className={`flex items-center ${isDark ? 'border-gray-600 text-gray-300 hover:bg-gray-800' : ''}`}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
          </div>
          <h1 className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Account Settings
          </h1>
          <p className={`mt-1 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
            Manage your account information and security settings
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Profile Information */}
          <div className="lg:col-span-2">
            <div className={`rounded-lg shadow-sm border p-6 ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
              <div className="flex items-center space-x-3 mb-6">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}>
                  <User className={`w-6 h-6 ${isDark ? 'text-gray-300' : 'text-gray-600'}`} />
                </div>
                <div>
                  <h2 className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    Profile Information
                  </h2>
                  <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    Update your personal information
                  </p>
                </div>
              </div>

              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="First Name"
                    value={userSettings.firstName}
                    onChange={(e) => setUserSettings(prev => ({ ...prev, firstName: e.target.value }))}
                    placeholder="Enter your first name"
                  />
                  <Input
                    label="Last Name"
                    value={userSettings.lastName}
                    onChange={(e) => setUserSettings(prev => ({ ...prev, lastName: e.target.value }))}
                    placeholder="Enter your last name"
                  />
                </div>

                <Input
                  label="Email Address"
                  type="email"
                  value={user?.email || ''}
                  disabled
                  className="bg-gray-50 dark:bg-gray-700"
                />

                <Input
                  label="Phone Number"
                  type="tel"
                  value={userSettings.phoneNumber}
                  onChange={(e) => setUserSettings(prev => ({ ...prev, phoneNumber: e.target.value }))}
                  placeholder="Enter your phone number"
                />

                <div className="flex justify-end">
                  <Button
                    onClick={handleUpdateProfile}
                    isLoading={isLoading}
                    className="flex items-center"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    Save Changes
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Security Settings */}
          <div className="space-y-6">
            {/* Security Overview */}
            <div className={`rounded-lg shadow-sm border p-6 ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center">
                  <Shield className="w-5 h-5 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <h3 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    Security Status
                  </h3>
                  <p className="text-sm text-green-600 dark:text-green-400">
                    Account Secured
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Mail className={`w-4 h-4 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
                    <span className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                      Email Verified
                    </span>
                  </div>
                  <span className="text-sm text-green-600 dark:text-green-400">✓</span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Key className={`w-4 h-4 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
                    <span className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                      MonoPassword Set
                    </span>
                  </div>
                  <span className="text-sm text-green-600 dark:text-green-400">✓</span>
                </div>

                {userSettings.phoneNumber && (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Phone className={`w-4 h-4 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
                      <span className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                        Phone Added
                      </span>
                    </div>
                    <span className="text-sm text-green-600 dark:text-green-400">✓</span>
                  </div>
                )}
              </div>
            </div>

            {/* Security Actions */}
            <div className={`rounded-lg shadow-sm border p-6 ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
              <h3 className={`font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Security Actions
              </h3>

              <div className="space-y-3">
                <Button
                  variant="outline"
                  onClick={() => setIsChangePasswordOpen(true)}
                  className={`w-full justify-start ${isDark ? 'border-gray-600 text-gray-300 hover:bg-gray-700' : ''}`}
                >
                  <Key className="w-4 h-4 mr-2" />
                  Change MonoPassword
                </Button>

                <Button
                  variant="outline"
                  className={`w-full justify-start ${isDark ? 'border-gray-600 text-gray-300 hover:bg-gray-700' : ''}`}
                >
                  <Database className="w-4 h-4 mr-2" />
                  Export Data
                </Button>
              </div>
            </div>

            {/* Account Info */}
            <div className={`rounded-lg shadow-sm border p-6 ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
              <h3 className={`font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Account Information
              </h3>

              <div className="space-y-3 text-sm">
                <div>
                  <span className={`font-medium ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                    Storage Location:
                  </span>
                  <span className={`ml-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                    Secure Cloud
                  </span>
                </div>
                <div>
                  <span className={`font-medium ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                    Member Since:
                  </span>
                  <span className={`ml-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                    {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Change MonoPassword Modal */}
      <Modal
        isOpen={isChangePasswordOpen}
        onClose={() => setIsChangePasswordOpen(false)}
        title="Change MonoPassword"
      >
        <div className="space-y-6">
          <div className="text-center">
            <div className="w-16 h-16 bg-yellow-100 dark:bg-yellow-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Key className="w-8 h-8 text-yellow-600 dark:text-yellow-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Update Your MonoPassword
            </h3>
            <p className="text-gray-600 dark:text-gray-300">
              Enter your current MonoPassword and choose a new one.
            </p>
          </div>

          <div className="space-y-4">
            <Input
              label="Current MonoPassword"
              type="password"
              value={passwordChange.currentMonoPassword}
              onChange={(e) => setPasswordChange(prev => ({ ...prev, currentMonoPassword: e.target.value }))}
              placeholder="Enter current MonoPassword"
              showPasswordToggle
              required
            />

            <Input
              label="New MonoPassword"
              type="password"
              value={passwordChange.newMonoPassword}
              onChange={(e) => setPasswordChange(prev => ({ ...prev, newMonoPassword: e.target.value }))}
              placeholder="Enter new MonoPassword"
              showPasswordToggle
              required
            />

            <Input
              label="Confirm New MonoPassword"
              type="password"
              value={passwordChange.confirmNewMonoPassword}
              onChange={(e) => setPasswordChange(prev => ({ ...prev, confirmNewMonoPassword: e.target.value }))}
              placeholder="Confirm new MonoPassword"
              showPasswordToggle
              required
            />
          </div>

          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg p-4">
            <p className="text-sm text-red-800 dark:text-red-200">
              <strong>Warning:</strong> Changing your MonoPassword will require you to re-enter it 
              to access your credentials. Make sure you remember the new password.
            </p>
          </div>

          <div className="flex space-x-3">
            <Button
              variant="outline"
              onClick={() => setIsChangePasswordOpen(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleChangeMonoPassword}
              disabled={!passwordChange.currentMonoPassword || !passwordChange.newMonoPassword || !passwordChange.confirmNewMonoPassword}
              className="flex-1"
            >
              Update MonoPassword
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Settings;