import CryptoJS from 'crypto-js';

export class CryptoUtils {
  private static deriveKey(monoPassword: string, salt: string): string {
    return CryptoJS.PBKDF2(monoPassword, salt, {
      keySize: 256 / 32,
      iterations: 10000
    }).toString();
  }

  static encrypt(data: string, monoPassword: string): string {
    const salt = CryptoJS.lib.WordArray.random(128 / 8).toString();
    const key = this.deriveKey(monoPassword, salt);
    const iv = CryptoJS.lib.WordArray.random(128 / 8);
    
    const encrypted = CryptoJS.AES.encrypt(data, key, {
      iv: iv,
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7
    });

    return salt + ':' + iv.toString() + ':' + encrypted.toString();
  }

  static decrypt(encryptedData: string, monoPassword: string): string {
    try {
      const parts = encryptedData.split(':');
      if (parts.length !== 3) {
        throw new Error('Invalid encrypted data format');
      }

      const [salt, ivString, encrypted] = parts;
      const key = this.deriveKey(monoPassword, salt);
      const iv = CryptoJS.enc.Hex.parse(ivString);

      const decrypted = CryptoJS.AES.decrypt(encrypted, key, {
        iv: iv,
        mode: CryptoJS.mode.CBC,
        padding: CryptoJS.pad.Pkcs7
      });

      return decrypted.toString(CryptoJS.enc.Utf8);
    } catch (error) {
      throw new Error('Failed to decrypt data. Invalid MonoPassword or corrupted data.');
    }
  }

  static hashPassword(password: string): string {
    return CryptoJS.SHA256(password).toString();
  }

  static compareHash(input: string, hashed: string): boolean {
    const inputHash = CryptoJS.SHA256(input).toString();
    return inputHash === hashed;
  }

  static generatePassword(options: {
    length: number;
    includeUppercase: boolean;
    includeLowercase: boolean;
    includeNumbers: boolean;
    includeSpecialChars: boolean;
  }): string {
    let charset = '';
    
    if (options.includeLowercase) charset += 'abcdefghijklmnopqrstuvwxyz';
    if (options.includeUppercase) charset += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    if (options.includeNumbers) charset += '0123456789';
    if (options.includeSpecialChars) charset += '!@#$%^&*()_+-=[]{}|;:,.<>?';

    if (!charset) return '';

    let password = '';
    for (let i = 0; i < options.length; i++) {
      password += charset.charAt(Math.floor(Math.random() * charset.length));
    }

    return password;
  }
}