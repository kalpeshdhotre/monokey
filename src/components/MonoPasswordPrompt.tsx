import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import Modal from './UI/Modal';
import Input from './UI/Input';
import Button from './UI/Button';
import { Shield, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';

interface MonoPasswordPromptProps {
  isOpen: boolean;
  onClose: () => void;
  onVerified: (password: string) => void;
}

const MonoPasswordPrompt: React.FC<MonoPasswordPromptProps> = ({
  isOpen,
  onClose,
  onVerified
}) => {
  const { verifyMonoPassword } = useAuth();
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [attempts, setAttempts] = useState(0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (verifyMonoPassword(password)) {
        onVerified(password);
        setPassword('');
        setAttempts(0);
        toast.success('MonoPassword verified');
      } else {
        setAttempts(prev => prev + 1);
        toast.error('Invalid MonoPassword');
        
        if (attempts >= 2) {
          toast.error('Too many failed attempts. Please try again later.');
          onClose();
        }
      }
    } catch (error) {
      toast.error('Verification failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setPassword('');
    setAttempts(0);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Verify MonoPassword">
      <div className="space-y-6">
        <div className="text-center">
          <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <Shield className="w-8 h-8 text-blue-600 dark:text-blue-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Security Verification Required
          </h3>
          <p className="text-gray-600 dark:text-gray-300">
            Please enter your MonoPassword to access this sensitive information.
          </p>
        </div>

        {attempts > 0 && (
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg p-4 flex items-start space-x-3">
            <AlertTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mt-0.5" />
            <div>
              <p className="text-sm text-yellow-800 dark:text-yellow-200">
                Invalid MonoPassword. {3 - attempts} attempts remaining.
              </p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="MonoPassword"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter your MonoPassword"
            showPasswordToggle
            autoFocus
            required
          />

          <div className="flex space-x-3">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              isLoading={isLoading}
              disabled={!password.trim()}
              className="flex-1"
            >
              Verify
            </Button>
          </div>
        </form>

        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
          <p className="text-xs text-gray-600 dark:text-gray-300">
            <strong>Security Note:</strong> Your MonoPassword is never stored or transmitted. 
            It's used locally to decrypt your data.
          </p>
        </div>
      </div>
    </Modal>
  );
};

export default MonoPasswordPrompt;