# MonoKey - Secure Password Manager

MonoKey is a modern, secure password manager that gives you complete control over your data. With flexible storage options and zero-knowledge encryption, it's the only password manager you'll ever need.

## 🔑 Key Features

- **One Password to Rule Them All**: Remember just your MonoPassword and access all credentials
- **Flexible Storage Options**: Choose between secure cloud, Google Drive, OneDrive, or local storage
- **Zero-Knowledge Encryption**: AES-256 encryption with client-side decryption only
- **Password Generation**: Create strong, unique passwords with customizable options
- **Cross-Platform Access**: Access your passwords from any device, anywhere
- **Advanced Security**: 2FA backup codes, recovery options, and secure sharing

## 🛡️ Security Architecture

- All credential data is encrypted using AES-256 with PBKDF2 key derivation
- MonoPassword is hashed using SHA-256 and never stored in plain text
- Data is decrypted only on the client-side after MonoPassword verification
- Zero-knowledge architecture ensures even we can't access your data

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ and npm
- Supabase account (for authentication and optional cloud storage)

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd monokey-password-manager
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
```

4. Configure your Supabase credentials in `.env`:
```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

5. Start the development server:
```bash
npm run dev
```

## 🏗️ Tech Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS
- **Authentication**: Supabase Auth
- **Encryption**: CryptoJS (AES-256, PBKDF2)
- **Animations**: Framer Motion
- **Forms**: React Hook Form
- **Notifications**: React Hot Toast
- **Icons**: Lucide React

## 📱 Storage Options

### 1. Secure Cloud (Default)
- Encrypted data stored in Supabase
- 99.9% uptime guarantee
- Automatic backups

### 2. Google Drive
- Sync with your existing Google Drive
- OAuth integration for secure access
- Files stored as encrypted JSON

### 3. OneDrive
- Microsoft OneDrive integration
- Enterprise-grade security
- Seamless file synchronization

### 4. Local Storage
- Maximum privacy with local-only storage
- Browser IndexedDB or downloadable files
- Complete offline access

## 🔐 Security Best Practices

1. **Strong MonoPassword**: Use a unique, complex password that you can remember
2. **Regular Backups**: Export your vault regularly for additional security
3. **Secure Environment**: Always use MonoKey on trusted devices
4. **Two-Factor Authentication**: Enable 2FA on your account for extra security

## 🛠️ Development

### Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── Layout/         # Header, Footer components
│   ├── UI/             # Button, Input, Modal components
│   └── ...             # Feature-specific components
├── contexts/           # React contexts (Auth, etc.)
├── pages/              # Page components
├── types/              # TypeScript type definitions
├── utils/              # Utility functions (crypto, API)
└── ...
```

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## 🚀 Deployment

The application is ready for deployment on various platforms:

- **Vercel**: Connect your repository for automatic deployments
- **Netlify**: Drag and drop the `dist` folder after building
- **Docker**: Use the included Dockerfile for containerized deployment

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Documentation**: Check our comprehensive docs
- **Issues**: Report bugs on GitHub Issues
- **Security**: Report security issues to security@monokey.app

## 🙏 Acknowledgments

- Built with [Bolt.new](https://bolt.new) - The AI-powered development platform
- Icons by [Lucide](https://lucide.dev)
- UI components inspired by modern design systems

---

**MonoKey** - Your secure digital life, simplified. 🐵🔑