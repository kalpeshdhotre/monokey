import React from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '../../contexts/ThemeContext';

const Footer: React.FC = () => {
  const { isDark } = useTheme();

  return (
    <>
      <footer className="bg-gray-900 dark:bg-gray-950 text-white py-12 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center space-x-2 mb-4">
                <img 
                  src="/Monkey.png" 
                  alt="MonoKey" 
                  className="w-8 h-8 object-contain"
                />
                <span className="text-xl font-bold">MonoKey</span>
              </div>
              <p className="text-gray-400 dark:text-gray-500 mb-4 max-w-md">
                Your secure password manager with flexible storage options. 
                One password to rule them all, with complete transparency and control over your data.
              </p>
              <div className="flex space-x-4">
                <a href="#" className="text-gray-400 dark:text-gray-500 hover:text-white transition-colors">
                  Privacy Policy
                </a>
                <a href="#" className="text-gray-400 dark:text-gray-500 hover:text-white transition-colors">
                  Terms of Service
                </a>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-4">Features</h3>
              <ul className="space-y-2 text-gray-400 dark:text-gray-500">
                <li>Zero-Knowledge Security</li>
                <li>Flexible Storage Options</li>
                <li>Password Generation</li>
                <li>Cross-Platform Access</li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-4">Support</h3>
              <ul className="space-y-2 text-gray-400 dark:text-gray-500">
                <li>
                  <a href="#" className="hover:text-white transition-colors">Help Center</a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">Contact Us</a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">Security</a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">Status</a>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 dark:border-gray-700 mt-8 pt-8 text-center text-gray-400 dark:text-gray-500">
            <p>&copy; 2025 MonoKey. All rights reserved.</p>
          </div>
        </div>
      </footer>

      {/* Floating Bolt.new Logo */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        className="fixed bottom-6 right-6 z-50"
      >
        <a
          href="https://bolt.new"
          target="_blank"
          rel="noopener noreferrer"
          className="block w-12 h-12 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110"
        >
          <img
            src={isDark ? "/white_circle_360x360.png" : "/black_circle_360x360.png"}
            alt="Powered by Bolt.new"
            className="w-full h-full rounded-full"
          />
        </a>
      </motion.div>
    </>
  );
};

export default Footer;