import { CryptoUtils } from './crypto';
import { Credential } from '../types';

export interface LocalFileData {
  version: string;
  credentials: Array<{
    id: string;
    accountName: string;
    encryptedData: string;
    icon?: string;
    createdAt: string;
    updatedAt: string;
  }>;
  metadata: {
    createdAt: string;
    lastModified: string;
    totalCredentials: number;
  };
}

export class LocalStorageService {
  private static readonly FILE_VERSION = '1.0.0';
  private static readonly FILE_EXTENSION = '.monokey.json';

  /**
   * Read and decrypt a local JSON file
   */
  static async readLocalFile(file: File, monoPassword: string): Promise<Credential[]> {
    try {
      const fileContent = await this.readFileContent(file);
      const fileData: LocalFileData = JSON.parse(fileContent);

      // Validate file format
      if (!fileData.version || !fileData.credentials || !Array.isArray(fileData.credentials)) {
        throw new Error('Invalid MonoKey file format');
      }

      // Decrypt credentials
      const credentials: Credential[] = [];
      for (const encCred of fileData.credentials) {
        try {
          const decryptedData = CryptoUtils.decrypt(encCred.encryptedData, monoPassword);
          const sensitiveData = JSON.parse(decryptedData);

          credentials.push({
            id: encCred.id,
            accountName: encCred.accountName,
            username: sensitiveData.username,
            password: sensitiveData.password,
            recoveryEmail: sensitiveData.recoveryEmail,
            recoveryMobile: sensitiveData.recoveryMobile,
            twoFactorCodes: sensitiveData.twoFactorCodes,
            icon: encCred.icon,
            createdAt: encCred.createdAt,
            updatedAt: encCred.updatedAt
          });
        } catch (error) {
          console.error('Failed to decrypt credential:', encCred.id, error);
          // Skip corrupted credentials but continue with others
        }
      }

      return credentials;
    } catch (error: any) {
      if (error.message.includes('Invalid MonoKey file format')) {
        throw error;
      }
      throw new Error('Failed to read or decrypt file. Please check your MonoKey and try again.');
    }
  }

  /**
   * Encrypt and prepare credentials for local file save
   */
  static prepareLocalFileData(credentials: Credential[], monoPassword: string): LocalFileData {
    const encryptedCredentials = credentials.map(credential => {
      // Encrypt sensitive data
      const sensitiveData = {
        username: credential.username,
        password: credential.password,
        recoveryEmail: credential.recoveryEmail,
        recoveryMobile: credential.recoveryMobile,
        twoFactorCodes: credential.twoFactorCodes
      };

      const encryptedData = CryptoUtils.encrypt(JSON.stringify(sensitiveData), monoPassword);

      return {
        id: credential.id,
        accountName: credential.accountName,
        encryptedData,
        icon: credential.icon,
        createdAt: credential.createdAt,
        updatedAt: credential.updatedAt
      };
    });

    return {
      version: this.FILE_VERSION,
      credentials: encryptedCredentials,
      metadata: {
        createdAt: new Date().toISOString(),
        lastModified: new Date().toISOString(),
        totalCredentials: credentials.length
      }
    };
  }

  /**
   * Download encrypted credentials as JSON file
   */
  static downloadLocalFile(credentials: Credential[], monoPassword: string, filename?: string): void {
    try {
      const fileData = this.prepareLocalFileData(credentials, monoPassword);
      const jsonString = JSON.stringify(fileData, null, 2);
      
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = filename || `monokey-credentials-${new Date().toISOString().split('T')[0]}${this.FILE_EXTENSION}`;
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      URL.revokeObjectURL(url);
    } catch (error) {
      throw new Error('Failed to prepare file for download');
    }
  }

  /**
   * Generate a unique ID for new credentials
   */
  static generateCredentialId(): string {
    return 'local_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  /**
   * Add a new credential to local credentials array
   */
  static addCredential(
    localCredentials: Credential[], 
    newCredential: Omit<Credential, 'id' | 'createdAt' | 'updatedAt'>
  ): Credential[] {
    const now = new Date().toISOString();
    const credential: Credential = {
      ...newCredential,
      id: this.generateCredentialId(),
      createdAt: now,
      updatedAt: now
    };

    return [...localCredentials, credential];
  }

  /**
   * Update an existing credential in local credentials array
   */
  static updateCredential(
    localCredentials: Credential[], 
    credentialId: string, 
    updates: Partial<Credential>
  ): Credential[] {
    return localCredentials.map(cred => 
      cred.id === credentialId 
        ? { ...cred, ...updates, updatedAt: new Date().toISOString() }
        : cred
    );
  }

  /**
   * Delete a credential from local credentials array
   */
  static deleteCredential(localCredentials: Credential[], credentialId: string): Credential[] {
    return localCredentials.filter(cred => cred.id !== credentialId);
  }

  /**
   * Validate if a file is a valid MonoKey file
   */
  static validateFileFormat(file: File): boolean {
    return file.name.endsWith(this.FILE_EXTENSION) || file.type === 'application/json';
  }

  /**
   * Read file content as text
   */
  private static readFileContent(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (event) => {
        const content = event.target?.result as string;
        resolve(content);
      };
      
      reader.onerror = () => {
        reject(new Error('Failed to read file'));
      };
      
      reader.readAsText(file);
    });
  }

  /**
   * Create an empty local file structure
   */
  static createEmptyFileData(): LocalFileData {
    return {
      version: this.FILE_VERSION,
      credentials: [],
      metadata: {
        createdAt: new Date().toISOString(),
        lastModified: new Date().toISOString(),
        totalCredentials: 0
      }
    };
  }
}