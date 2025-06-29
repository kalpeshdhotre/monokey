import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Shield, 
  Key, 
  Cloud, 
  Smartphone, 
  Lock,
  CheckCircle,
  ArrowRight,
  Zap,
  Globe,
  Database,
  HardDrive,
  Monitor,
  Keyboard,
  Wifi,
  WifiOff
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
      icon: <Cloud className="w-8 h-8" />,
      title: "Secure Cloud Storage",
      description: "Your encrypted data is stored in our secure cloud infrastructure with 99.9% uptime guarantee and automatic backups."
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

  const upcomingFeatures = [
    {
      icon: (
        <div className="relative">
          <Cloud className="w-8 h-8" />
          <div className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
            <Database className="w-2 h-2 text-white" />
          </div>
        </div>
      ),
      title: "Flexible Storage Options",
      description: "Take full control of your data—store your credentials securely in your own cloud with support for Google Drive, OneDrive, and more.",
      gradient: "from-blue-500 to-cyan-500"
    },
    {
      icon: (
        <div className="relative">
          <Monitor className="w-8 h-8" />
          <div className="absolute -bottom-1 -right-1 flex space-x-0.5">
            <Wifi className="w-3 h-3 text-green-500" />
            <WifiOff className="w-3 h-3 text-orange-500" />
          </div>
        </div>
      ),
      title: "Desktop App with Offline Access",
      description: "Stay protected even without internet. Our upcoming desktop app securely stores your credentials locally, so you're always covered—online or off.",
      gradient: "from-purple-500 to-pink-500"
    },
    {
      icon: (
        <div className="relative">
          <Smartphone className="w-8 h-8" />
          <div className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-r from-green-500 to-blue-500 rounded-full flex items-center justify-center">
            <ArrowRight className="w-2 h-2 text-white" />
          </div>
        </div>
      ),
      title: "Smart Mobile App",
      description: "Access your vault from anywhere with our mobile app. Seamlessly share credentials between mobile and desktop, even when you're not near your PC.",
      gradient: "from-green-500 to-emerald-500"
    },
    {
      icon: (
        <div className="relative">
          <Keyboard className="w-8 h-8" />
          <div className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center">
            <Shield className="w-2 h-2 text-white" />
          </div>
        </div>
      ),
      title: "Secure Virtual Keyboard",
      description: "Bypass copy-paste restrictions with ease. Our virtual keyboard lets you enter credentials securely, even on sites that block Ctrl+C / Ctrl+V.",
      gradient: "from-orange-500 to-red-500"
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
              <div className="inline-flex items-center justify-center mb-8">
                <img 
                  src="/Monkey.png" 
                  alt="MonoKey Mascot" 
                  className="w-96 h-96 object-contain drop-shadow-2xl"
                />
              </div>
              
              {/* Main Bold Message - Now the primary headline */}
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-gray-900 dark:text-white mb-6 leading-tight">
                Tired of password chaos?<br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-red-500">
                  Let the monokey handle it.
                </span>
              </h1>
              
              <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-300 max-w-4xl mx-auto leading-relaxed font-medium">
                All your secrets, one smart key - MonoKey.online keeps it simple and secure.
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

      {/* Upcoming Features Section */}
      <section className="py-20 bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-800 dark:to-gray-900 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
            >
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full mb-6">
                <Zap className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
                Upcoming Features
              </h2>
              <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
                We're constantly evolving MonoKey to give you even more control, 
                flexibility, and security. Here's what's coming next.
              </p>
            </motion.div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {upcomingFeatures.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.15 }}
                viewport={{ once: true }}
                className="relative group"
              >
                <div className="absolute inset-0 bg-gradient-to-r opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl blur-xl"
                     style={{ background: `linear-gradient(135deg, var(--tw-gradient-stops))` }}></div>
                <div className="relative bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 hover:shadow-2xl transition-all duration-300 hover:-translate-y-2">
                  <div className="flex items-start space-x-4">
                    <div className={`flex-shrink-0 w-16 h-16 bg-gradient-to-r ${feature.gradient} rounded-xl flex items-center justify-center text-white shadow-lg`}>
                      {feature.icon}
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
                        {feature.title}
                      </h3>
                      <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                        {feature.description}
                      </p>
                    </div>
                  </div>
                  
                  {/* Coming Soon Badge */}
                  <div className="absolute top-4 right-4">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30 text-purple-800 dark:text-purple-200 border border-purple-200 dark:border-purple-700">
                      Coming Soon
                    </span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Call to Action for Updates */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            viewport={{ once: true }}
            className="text-center mt-12"
          >
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg border border-gray-100 dark:border-gray-700 max-w-2xl mx-auto">
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                Stay Updated
              </h3>
              <p className="text-gray-600 dark:text-gray-300 mb-6">
                Be the first to know when these exciting features launch. 
                Join MonoKey today and get notified about all updates.
              </p>
              <Link to="/register">
                <Button size="lg" className="px-8 py-3">
                  Join MonoKey Now
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
            </div>
          </motion.div>
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
              className="text-center relative"
            >
              <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4 relative">
                <Smartphone className="w-8 h-8" />
                {/* Coming Soon Badge for MFA */}
                <div className="absolute -top-2 -right-2">
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gradient-to-r from-orange-400 to-red-400 text-white shadow-lg">
                    Soon
                  </span>
                </div>
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