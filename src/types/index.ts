export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  storageLocation: StorageLocation;
  monoPasswordHash?: string;
  createdAt: string;
}

export interface Credential {
  id: string;
  accountName: string;
  username: string;
  password: string;
  recoveryEmail?: string;
  recoveryMobile?: string;
  twoFactorCodes?: string;
  icon?: string;
  createdAt: string;
  updatedAt: string;
}

export interface EncryptedCredential {
  id: string;
  accountName: string;
  encryptedData: string;
  icon?: string;
  createdAt: string;
  updatedAt: string;
}

export type StorageLocation = 'saas' | 'google-drive' | 'onedrive' | 'local';

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface PasswordGeneratorOptions {
  length: number;
  includeUppercase: boolean;
  includeLowercase: boolean;
  includeNumbers: boolean;
  includeSpecialChars: boolean;
}