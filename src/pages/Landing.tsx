import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Shield, 
  Key, 
  Cloud, 
  HardDrive, 
  Smartphone, 
  Lock,
  CheckCircle,
  ArrowRight,
  Zap,
  Globe,
  Database
} from 'lucide-react';
import Button from '../components/UI/Button';

const Landing: React.FC = () => {
  const features = [
    {
      icon: <Key className="w-8 h-8" />,
      title: "One Password to Rule Them All",
      description: "Remember just your MonoPassword and access all your credentials securely. No more forgotten passwords or security compromises."
    },
    {
      icon: <Database className="w-8 h-8" />,
      title: "Choose Your Storage Location",
      description: "Complete transparency and control. Store your encrypted data in our secure cloud, Google Drive, OneDrive, or locally on your device."
    },
    {
      icon: <Shield className="w-8 h-8" />,
      title: "Zero-Knowledge Encryption",
      description: "Your data is encrypted with AES-256 using your MonoPassword. Even we can't access your information without your master key."
    },
    {
      icon: <Zap className="w-8 h-8" />,
      title: "Instant Password Generation",
      description: "Generate strong, unique passwords with customizable options. Never reuse weak passwords again."
    },
    {
      icon: <Globe className="w-8 h-8" />,
      title: "Cross-Platform Access",
      description: "Access your passwords from any device, anywhere. Your security travels with you."
    },
    {
      icon: <Lock className="w-8 h-8" />,
      title: "Advanced Security Features",
      description: "2FA backup codes, recovery options, and secure sharing. Enterprise-grade security for everyone."
    }
  ];

  const storageOptions = [
    {
      icon: <Cloud className="w-12 h-12 text-blue-500" />,
      title: "Secure Cloud",
      description: "Our encrypted cloud storage with 99.9% uptime guarantee"
    },
    {
      icon: <HardDrive className="w-12 h-12 text-green-500" />,
      title: "Local Storage",
      description: "Keep your data on your device for maximum privacy"
    },
    {
      icon: <div className="w-12 h-12 bg-red-500 rounded-lg flex items-center justify-center text-white font-bold">G</div>,
      title: "Google Drive",
      description: "Sync with your existing Google Drive account"
    },
    {
      icon: <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold">O</div>,
      title: "OneDrive",
      description: "Integrate with Microsoft OneDrive seamlessly"
    }
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-blue-900 py-20 overflow-hidden transition-colors">
        <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="mb-8"
            >
              <div className="inline-flex items-center justify-center mb-6">
                <img 
                  src="/Monkey.png" 
                  alt="MonoKey Mascot" 
                  className="w-96 h-96 object-contain drop-shadow-2xl"
                />
              </div>
              <h1 className="text-5xl md:text-6xl font-bold text-gray-900 dark:text-white mb-6">
                Meet <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">MonoKey</span>
              </h1>
              <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-300 mb-8 max-w-3xl mx-auto leading-relaxed">
                The only password manager that gives you complete control over your data. 
                One password, infinite possibilities, absolute security.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12"
            >
              <Link to="/register">
                <Button size="lg" className="px-8 py-4 text-lg">
                  Get Started Free
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
              <Link to="/login">
                <Button variant="outline" size="lg" className="px-8 py-4 text-lg border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800">
                  Sign In
                </Button>
              </Link>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="flex items-center justify-center space-x-6 text-sm text-gray-500 dark:text-gray-400"
            >
              <div className="flex items-center">
                <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
                No Credit Card Required
              </div>
              <div className="flex items-center">
                <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
                Free Forever Plan
              </div>
              <div className="flex items-center">
                <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
                Zero-Knowledge Security
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white dark:bg-gray-900 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Why Choose MonoKey?
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
              Built with security, privacy, and user control at its core. 
              Experience the future of password management.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
              >
                <div className="text-blue-600 dark:text-blue-400 mb-4">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                  {feature.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Storage Options Section */}
      <section className="py-20 bg-gray-50 dark:bg-gray-800 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Your Data, Your Choice
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
              Complete transparency and control over where your encrypted data lives. 
              Switch between storage options anytime.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {storageOptions.map((option, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="bg-white dark:bg-gray-700 p-6 rounded-xl shadow-md text-center hover:shadow-lg transition-all duration-300"
              >
                <div className="flex justify-center mb-4">
                  {option.icon}
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  {option.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-300 text-sm">
                  {option.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Security Section */}
      <section className="py-20 bg-gradient-to-br from-gray-900 to-blue-900 dark:from-gray-800 dark:to-blue-800 text-white transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">
              Bank-Level Security
            </h2>
            <p className="text-xl text-blue-100 dark:text-blue-200 max-w-3xl mx-auto">
              Your security is our top priority. MonoKey uses industry-leading encryption 
              and security practices to keep your data safe.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="text-center"
            >
              <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-semibold mb-3">AES-256 Encryption</h3>
              <p className="text-blue-100 dark:text-blue-200">
                Military-grade encryption ensures your data remains secure even if intercepted.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              viewport={{ once: true }}
              className="text-center"
            >
              <div className="w-16 h-16 bg-purple-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <Key className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Zero-Knowledge</h3>
              <p className="text-blue-100 dark:text-blue-200">
                We never see your MonoPassword or decrypted data. Only you have access.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              viewport={{ once: true }}
              className="text-center"
            >
              <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <Smartphone className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Multi-Factor Auth</h3>
              <p className="text-blue-100 dark:text-blue-200">
                Additional security layers including 2FA and biometric authentication.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-white dark:bg-gray-900 transition-colors">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-6">
              Ready to Secure Your Digital Life?
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-2xl mx-auto">
              Join thousands of users who trust MonoKey to keep their credentials safe. 
              Start your secure journey today.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/register">
                <Button size="lg" className="px-8 py-4 text-lg">
                  Create Your MonoKey Account
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default Landing;