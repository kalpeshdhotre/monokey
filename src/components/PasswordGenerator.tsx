import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { RefreshCw, Copy, Check } from 'lucide-react';
import { CryptoUtils } from '../utils/crypto';
import Modal from './UI/Modal';
import Button from './UI/Button';
import toast from 'react-hot-toast';

interface PasswordGeneratorProps {
  isOpen: boolean;
  onClose: () => void;
  onPasswordGenerated: (password: string) => void;
}

const PasswordGenerator: React.FC<PasswordGeneratorProps> = ({
  isOpen,
  onClose,
  onPasswordGenerated
}) => {
  const [password, setPassword] = useState('');
  const [length, setLength] = useState(16);
  const [includeUppercase, setIncludeUppercase] = useState(true);
  const [includeLowercase, setIncludeLowercase] = useState(true);
  const [includeNumbers, setIncludeNumbers] = useState(true);
  const [includeSpecialChars, setIncludeSpecialChars] = useState(true);
  const [copied, setCopied] = useState(false);

  const generatePassword = () => {
    const newPassword = CryptoUtils.generatePassword({
      length,
      includeUppercase,
      includeLowercase,
      includeNumbers,
      includeSpecialChars
    });
    setPassword(newPassword);
    setCopied(false);
  };

  const copyPassword = async () => {
    if (password) {
      await navigator.clipboard.writeText(password);
      setCopied(true);
      toast.success('Password copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const usePassword = () => {
    if (password) {
      onPasswordGenerated(password);
      toast.success('Password applied');
    }
  };

  React.useEffect(() => {
    if (isOpen) {
      generatePassword();
    }
  }, [isOpen, length, includeUppercase, includeLowercase, includeNumbers, includeSpecialChars]);

  const getPasswordStrength = () => {
    if (!password) return { score: 0, label: 'None', color: 'gray' };
    
    let score = 0;
    if (password.length >= 12) score += 2;
    else if (password.length >= 8) score += 1;
    
    if (/[a-z]/.test(password)) score += 1;
    if (/[A-Z]/.test(password)) score += 1;
    if (/[0-9]/.test(password)) score += 1;
    if (/[^A-Za-z0-9]/.test(password)) score += 1;

    if (score >= 5) return { score, label: 'Very Strong', color: 'green' };
    if (score >= 4) return { score, label: 'Strong', color: 'blue' };
    if (score >= 3) return { score, label: 'Medium', color: 'yellow' };
    if (score >= 2) return { score, label: 'Weak', color: 'orange' };
    return { score, label: 'Very Weak', color: 'red' };
  };

  const strength = getPasswordStrength();

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Password Generator" size="lg">
      <div className="space-y-6">
        {/* Generated Password Display */}
        <div className="space-y-3">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Generated Password
          </label>
          <div className="relative">
            <input
              type="text"
              value={password}
              readOnly
              className="w-full px-4 py-3 pr-20 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 font-mono text-sm text-gray-900 dark:text-white"
              placeholder="Click generate to create password"
            />
            <div className="absolute inset-y-0 right-0 flex items-center space-x-1 pr-3">
              <button
                onClick={copyPassword}
                className="p-1 text-gray-400 hover:text-blue-600 dark:text-gray-500 dark:hover:text-blue-400 transition-colors"
                title="Copy password"
              >
                {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
              </button>
              <button
                onClick={generatePassword}
                className="p-1 text-gray-400 hover:text-blue-600 dark:text-gray-500 dark:hover:text-blue-400 transition-colors"
                title="Generate new password"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          </div>
          
          {/* Password Strength Indicator */}
          <div className="flex items-center space-x-3">
            <div className="flex-1 bg-gray-200 dark:bg-gray-600 rounded-full h-2">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${(strength.score / 6) * 100}%` }}
                className={`h-2 rounded-full bg-${strength.color}-500`}
                transition={{ duration: 0.3 }}
              />
            </div>
            <span className={`text-sm font-medium text-${strength.color}-600 dark:text-${strength.color}-400`}>
              {strength.label}
            </span>
          </div>
        </div>

        {/* Password Options */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Password Length: {length}
            </label>
            <input
              type="range"
              min="4"
              max="50"
              value={length}
              onChange={(e) => setLength(parseInt(e.target.value))}
              className="w-full h-2 bg-gray-200 dark:bg-gray-600 rounded-lg appearance-none cursor-pointer slider"
            />
            <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
              <span>4</span>
              <span>50</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <label className="flex items-center space-x-3 cursor-pointer">
              <input
                type="checkbox"
                checked={includeUppercase}
                onChange={(e) => setIncludeUppercase(e.target.checked)}
                className="w-4 h-4 text-blue-600 border-gray-300 dark:border-gray-600 rounded focus:ring-blue-500 bg-white dark:bg-gray-700"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">Uppercase (A-Z)</span>
            </label>

            <label className="flex items-center space-x-3 cursor-pointer">
              <input
                type="checkbox"
                checked={includeLowercase}
                onChange={(e) => setIncludeLowercase(e.target.checked)}
                className="w-4 h-4 text-blue-600 border-gray-300 dark:border-gray-600 rounded focus:ring-blue-500 bg-white dark:bg-gray-700"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">Lowercase (a-z)</span>
            </label>

            <label className="flex items-center space-x-3 cursor-pointer">
              <input
                type="checkbox"
                checked={includeNumbers}
                onChange={(e) => setIncludeNumbers(e.target.checked)}
                className="w-4 h-4 text-blue-600 border-gray-300 dark:border-gray-600 rounded focus:ring-blue-500 bg-white dark:bg-gray-700"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">Numbers (0-9)</span>
            </label>

            <label className="flex items-center space-x-3 cursor-pointer">
              <input
                type="checkbox"
                checked={includeSpecialChars}
                onChange={(e) => setIncludeSpecialChars(e.target.checked)}
                className="w-4 h-4 text-blue-600 border-gray-300 dark:border-gray-600 rounded focus:ring-blue-500 bg-white dark:bg-gray-700"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">Special (!@#$)</span>
            </label>
          </div>
        </div>

        {/* Actions */}
        <div className="flex space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
          <Button variant="outline" onClick={onClose} className="flex-1">
            Cancel
          </Button>
          <Button onClick={usePassword} disabled={!password} className="flex-1">
            Use This Password
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default PasswordGenerator;