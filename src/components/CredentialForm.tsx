import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { motion } from 'framer-motion';
import { Save, Wand2, Eye, EyeOff } from 'lucide-react';
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
      icon: '🔐'
    }
  });

  const watchedPassword = watch('password');

  useEffect(() => {
    if (credential && isEditing) {
      reset({
        accountName: credential.accountName,
        username: credential.username,
        password: credential.password,
        recoveryEmail: credential.recoveryEmail || '',
        recoveryMobile: credential.recoveryMobile || '',
        twoFactorCodes: credential.twoFactorCodes || '',
        icon: credential.icon || '🔐'
      });
    } else {
      reset({
        accountName: '',
        username: '',
        password: '',
        recoveryEmail: '',
        recoveryMobile: '',
        twoFactorCodes: '',
        icon: '🔐'
      });
    }
  }, [credential, isEditing, reset]);

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
        icon: data.icon
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

  const commonIcons = [
    '🔐', '📧', '🏦', '💳', '🛒', '📱', '💼', '🎮', '📺', '☁️',
    '🌐', '📊', '🎵', '📷', '💬', '🔧', '📝', '🎯', '🚀', '⭐'
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
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Icon
            </label>
            <div className="grid grid-cols-10 gap-2">
              {commonIcons.map((icon) => (
                <button
                  key={icon}
                  type="button"
                  onClick={() => setValue('icon', icon)}
                  className={`p-2 text-xl rounded-lg border-2 transition-all hover:scale-110 ${
                    watch('icon') === icon
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  {icon}
                </button>
              ))}
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
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                {...register('password', { required: 'Password is required' })}
                className="w-full px-3 py-2 pr-20 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter password"
              />
              <div className="absolute inset-y-0 right-0 flex items-center space-x-1 pr-3">
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="p-1 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
                <button
                  type="button"
                  onClick={() => setIsPasswordGenOpen(true)}
                  className="p-1 text-gray-400 hover:text-blue-600"
                  title="Generate password"
                >
                  <Wand2 className="w-4 h-4" />
                </button>
              </div>
            </div>
            {errors.password && (
              <p className="text-sm text-red-600 mt-1">{errors.password.message}</p>
            )}
          </div>

          {/* Optional Fields */}
          <div className="border-t pt-4">
            <h3 className="text-sm font-medium text-gray-700 mb-3">
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
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  2FA Backup Codes
                </label>
                <textarea
                  {...register('twoFactorCodes')}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter backup codes separated by commas or new lines"
                />
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex space-x-3 pt-4 border-t">
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