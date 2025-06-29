import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { CryptoUtils } from '../utils/crypto';
import Button from '../components/UI/Button';
import Input from '../components/UI/Input';
import toast from 'react-hot-toast';

interface RegisterForm {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber?: string;
  monoPassword: string;
  confirmMonoPassword: string;
  password: string;
  confirmPassword: string;
}

const Register: React.FC = () => {
  const { signUp } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors }
  } = useForm<RegisterForm>();

  const monoPassword = watch('monoPassword');
  const password = watch('password');

  const onSubmit = async (data: RegisterForm) => {
    if (data.monoPassword !== data.confirmMonoPassword) {
      toast.error('MonoPasswords do not match');
      return;
    }

    if (data.password !== data.confirmPassword) {
      toast.error('Account passwords do not match');
      return;
    }

    setIsLoading(true);

    try {
      const monoPasswordHash = CryptoUtils.hashPassword(data.monoPassword);
      
      await signUp(data.email, data.password, {
        firstName: data.firstName,
        lastName: data.lastName,
        phoneNumber: data.phoneNumber || null,
        monoPasswordHash,
        storageLocation: 'saas'
      });

      toast.success('Account created successfully!');
      navigate('/dashboard');
    } catch (error: any) {
      toast.error(error.message || 'Failed to create account');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="max-w-md w-full space-y-8"
      >
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl mb-4 shadow-lg">
            <span className="text-2xl">🐵🔑</span>
          </div>
          <h2 className="text-3xl font-bold text-gray-900">Create Your MonoKey</h2>
          <p className="mt-2 text-gray-600">
            Join thousands securing their digital lives
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="First Name"
                {...register('firstName', { required: 'First name is required' })}
                error={errors.firstName?.message}
              />
              <Input
                label="Last Name"
                {...register('lastName', { required: 'Last name is required' })}
                error={errors.lastName?.message}
              />
            </div>

            <Input
              label="Email Address"
              type="email"
              {...register('email', { 
                required: 'Email is required',
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: 'Invalid email address'
                }
              })}
              error={errors.email?.message}
            />

            <Input
              label="Phone Number (Optional)"
              type="tel"
              {...register('phoneNumber')}
              error={errors.phoneNumber?.message}
            />

            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Security Setup
              </h3>
              
              <Input
                label="MonoPassword (Master Key)"
                type="password"
                showPasswordToggle
                {...register('monoPassword', { 
                  required: 'MonoPassword is required',
                  minLength: {
                    value: 8,
                    message: 'MonoPassword must be at least 8 characters'
                  }
                })}
                error={errors.monoPassword?.message}
              />

              <Input
                label="Confirm MonoPassword"
                type="password"
                showPasswordToggle
                {...register('confirmMonoPassword', { 
                  required: 'Please confirm your MonoPassword'
                })}
                error={errors.confirmMonoPassword?.message}
              />

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mt-4">
                <p className="text-sm text-yellow-800">
                  <strong>Important:</strong> Your MonoPassword is the only way to access your encrypted data. 
                  We cannot recover it if lost. Please store it securely.
                </p>
              </div>
            </div>

            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Account Password
              </h3>
              
              <Input
                label="Account Password"
                type="password"
                showPasswordToggle
                {...register('password', { 
                  required: 'Account password is required',
                  minLength: {
                    value: 6,
                    message: 'Password must be at least 6 characters'
                  }
                })}
                error={errors.password?.message}
              />

              <Input
                label="Confirm Account Password"
                type="password"
                showPasswordToggle
                {...register('confirmPassword', { 
                  required: 'Please confirm your password'
                })}
                error={errors.confirmPassword?.message}
              />

              <p className="text-sm text-gray-600 mt-2">
                This is different from your MonoPassword and is used to sign into your account.
              </p>
            </div>

            <Button
              type="submit"
              className="w-full"
              size="lg"
              isLoading={isLoading}
            >
              Create MonoKey Account
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-gray-600">
              Already have an account?{' '}
              <Link to="/login" className="text-blue-600 hover:text-blue-700 font-medium">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Register;