import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { motion } from 'framer-motion';
import { Save, Eye, EyeOff, Upload } from 'lucide-react';
import { Credential } from '../types';
import Modal from './UI/Modal';
import Input from './UI/Input';
import Button from './UI/Button';
import PasswordGenerator from './PasswordGenerator';
import toast from 'react-hot-toast';

interface CredentialFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (credential: Omit<Credential, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  credential?: Credential | null;
  isEditing?: boolean;
}

interface FormData {
  accountName: string;
  username: string;
  password: string;
  recoveryEmail?: string;
  recoveryMobile?: string;
  twoFactorCodes?: string;
  icon: string;
}

const CredentialForm: React.FC<CredentialFormProps> = ({
  isOpen,
  onClose,
  onSave,
  credential,
  isEditing = false
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isPasswordGenOpen, setIsPasswordGenOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [customIcon, setCustomIcon] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors }
  } = useForm<FormData>({
    defaultValues: {
      accountName: '',
      username: '',
      password: '',
      recoveryEmail: '',
      recoveryMobile: '',
      twoFactorCodes: '',
      icon: '📧'
    }
  });

  const watchedPassword = watch('password');

  // Clear form when opening for new credential or reset for editing
  useEffect(() => {
    if (isOpen) {
      if (credential && isEditing) {
        // Editing existing credential
        reset({
          accountName: credential.accountName,
          username: credential.username,
          password: credential.password,
          recoveryEmail: credential.recoveryEmail || '',
          recoveryMobile: credential.recoveryMobile || '',
          twoFactorCodes: credential.twoFactorCodes || '',
          icon: credential.icon || '📧'
        });
        setCustomIcon(credential.icon?.startsWith('data:') ? credential.icon : null);
      } else {
        // Adding new credential - clear everything
        reset({
          accountName: '',
          username: '',
          password: '',
          recoveryEmail: '',
          recoveryMobile: '',
          twoFactorCodes: '',
          icon: '📧'
        });
        setCustomIcon(null);
      }
    }
  }, [isOpen, credential, isEditing, reset]);

  const onSubmit = async (data: FormData) => {
    setIsLoading(true);
    try {
      await onSave({
        accountName: data.accountName,
        username: data.username,
        password: data.password,
        recoveryEmail: data.recoveryEmail,
        recoveryMobile: data.recoveryMobile,
        twoFactorCodes: data.twoFactorCodes,
        icon: customIcon || data.icon
      });
      
      toast.success(isEditing ? 'Credential updated successfully' : 'Credential saved successfully');
      onClose();
    } catch (error: any) {
      toast.error(error.message || 'Failed to save credential');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordGenerated = (password: string) => {
    setValue('password', password);
    setIsPasswordGenOpen(false);
  };

  const handleIconUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 1024 * 1024) { // 1MB limit
        toast.error('Icon file size must be less than 1MB');
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setCustomIcon(result);
        setValue('icon', result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Predefined service icons
  const serviceIcons = [
    { name: 'Gmail', icon: '📧', color: 'bg-red-100 dark:bg-red-900/20' },
    { name: 'Hotmail', icon: '📮', color: 'bg-blue-100 dark:bg-blue-900/20' },
    { name: 'Yahoo', icon: '💌', color: 'bg-purple-100 dark:bg-purple-900/20' },
    { name: 'Amazon', icon: '📦', color: 'bg-orange-100 dark:bg-orange-900/20' },
    { name: 'Flipkart', icon: '🛒', color: 'bg-yellow-100 dark:bg-yellow-900/20' },
    { name: 'GitHub', icon: '🐙', color: 'bg-gray-100 dark:bg-gray-700' },
    { name: 'YouTube', icon: '📺', color: 'bg-red-100 dark:bg-red-900/20' },
    { name: 'Spotify', icon: '🎵', color: 'bg-green-100 dark:bg-green-900/20' },
    { name: 'Netflix', icon: '🎬', color: 'bg-red-100 dark:bg-red-900/20' },
    { name: 'Udemy', icon: '🎓', color: 'bg-purple-100 dark:bg-purple-900/20' },
    { name: 'eBay', icon: '🏪', color: 'bg-blue-100 dark:bg-blue-900/20' },
    { name: 'Instagram', icon: '📸', color: 'bg-pink-100 dark:bg-pink-900/20' },
    { name: 'Facebook', icon: '👥', color: 'bg-blue-100 dark:bg-blue-900/20' },
    { name: 'Twitter/X', icon: '🐦', color: 'bg-blue-100 dark:bg-blue-900/20' },
    { name: 'Default', icon: '🔐', color: 'bg-gray-100 dark:bg-gray-700' }
  ];

  return (
    <>
      <Modal 
        isOpen={isOpen} 
        onClose={onClose} 
        title={isEditing ? 'Edit Credential' : 'Add New Credential'}
        size="lg"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Icon Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Service Icon
            </label>
            <div className="grid grid-cols-5 gap-2 mb-4">
              {serviceIcons.map((service) => (
                <button
                  key={service.name}
                  type="button"
                  onClick={() => {
                    setValue('icon', service.icon);
                    setCustomIcon(null);
                  }}
                  className={`p-3 text-xl rounded-lg border-2 transition-all hover:scale-105 ${
                    watch('icon') === service.icon && !customIcon
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                  } ${service.color}`}
                  title={service.name}
                >
                  {service.icon}
                </button>
              ))}
            </div>

            {/* Custom Icon Upload */}
            <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Custom Icon (Optional)
              </label>
              <div className="flex items-center space-x-4">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleIconUpload}
                  className="hidden"
                  id="icon-upload"
                />
                <label
                  htmlFor="icon-upload"
                  className="flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-gray-700 dark:text-gray-300"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Upload Icon
                </label>
                {customIcon && (
                  <div className="w-12 h-12 border-2 border-blue-500 rounded-lg overflow-hidden">
                    <img src={customIcon} alt="Custom icon" className="w-full h-full object-cover" />
                  </div>
                )}
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Recommended: 64x64px, max 1MB
              </p>
            </div>
          </div>

          {/* Account Name */}
          <Input
            label="Account Name"
            {...register('accountName', { required: 'Account name is required' })}
            error={errors.accountName?.message}
            placeholder="e.g., Gmail, GitHub, Bank of America"
          />

          {/* Username */}
          <Input
            label="Username/Email"
            {...register('username', { required: 'Username is required' })}
            error={errors.username?.message}
            placeholder="your.email@example.com"
          />

          {/* Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Password
            </label>
            <div className="flex space-x-2">
              <div className="flex-1 relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  {...register('password', { required: 'Password is required' })}
                  className="w-full px-3 py-2 pr-10 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="Enter password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsPasswordGenOpen(true)}
                className="px-4 py-2 whitespace-nowrap text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Auto Generate
              </Button>
            </div>
            {errors.password && (
              <p className="text-sm text-red-600 dark:text-red-400 mt-1">{errors.password.message}</p>
            )}
          </div>

          {/* Optional Fields */}
          <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Recovery Information (Optional)
            </h3>
            
            <div className="space-y-4">
              <Input
                label="Recovery Email"
                type="email"
                {...register('recoveryEmail')}
                placeholder="backup@example.com"
              />

              <Input
                label="Recovery Mobile"
                type="tel"
                {...register('recoveryMobile')}
                placeholder="+1 (555) 123-4567"
              />

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  2FA Backup Codes
                </label>
                <textarea
                  {...register('twoFactorCodes')}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                  placeholder="Enter backup codes separated by commas or new lines"
                />
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              isLoading={isLoading}
              className="flex-1"
            >
              <Save className="w-4 h-4 mr-2" />
              {isEditing ? 'Update' : 'Save'} Credential
            </Button>
          </div>
        </form>
      </Modal>

      <PasswordGenerator
        isOpen={isPasswordGenOpen}
        onClose={() => setIsPasswordGenOpen(false)}
        onPasswordGenerated={handlePasswordGenerated}
      />
    </>
  );
};

export default CredentialForm;