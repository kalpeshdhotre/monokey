import { supabase } from './supabase';
import { CryptoUtils } from './crypto';
import { Credential, EncryptedCredential } from '../types';

export class DatabaseService {
  static async saveCredential(credential: Omit<Credential, 'id' | 'createdAt' | 'updatedAt'>, monoKey: string): Promise<{ id: string; createdAt: string; updatedAt: string }> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    // Encrypt the credential data
    const sensitiveData = {
      username: credential.username,
      password: credential.password,
      recoveryEmail: credential.recoveryEmail,
      recoveryMobile: credential.recoveryMobile,
      twoFactorCodes: credential.twoFactorCodes
    };

    const encryptedData = CryptoUtils.encrypt(JSON.stringify(sensitiveData), monoKey);

    const { data, error } = await supabase
      .from('credentials')
      .insert({
        user_id: user.id,
        account_name: credential.accountName,
        encrypted_data: encryptedData,
        icon: credential.icon || '🔐'
      })
      .select('id, created_at, updated_at')
      .single();

    if (error) throw error;

    return {
      id: data.id,
      createdAt: data.created_at,
      updatedAt: data.updated_at
    };
  }

  static async getCredentials(monoKey: string): Promise<Credential[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data: encryptedCredentials, error } = await supabase
      .from('credentials')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Decrypt credentials
    const credentials: Credential[] = [];
    for (const encCred of encryptedCredentials || []) {
      try {
        const decryptedData = CryptoUtils.decrypt(encCred.encrypted_data, monoKey);
        const sensitiveData = JSON.parse(decryptedData);

        credentials.push({
          id: encCred.id,
          accountName: encCred.account_name,
          username: sensitiveData.username,
          password: sensitiveData.password,
          recoveryEmail: sensitiveData.recoveryEmail,
          recoveryMobile: sensitiveData.recoveryMobile,
          twoFactorCodes: sensitiveData.twoFactorCodes,
          icon: encCred.icon,
          createdAt: encCred.created_at,
          updatedAt: encCred.updated_at
        });
      } catch (error) {
        console.error('Failed to decrypt credential:', encCred.id, error);
        // Skip corrupted credentials
      }
    }

    return credentials;
  }

  static async updateCredential(id: string, credential: Partial<Credential>, monoKey: string): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    // Get current credential to merge with updates
    const { data: currentCred, error: fetchError } = await supabase
      .from('credentials')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (fetchError) throw fetchError;

    // Decrypt current data
    const currentDecrypted = JSON.parse(CryptoUtils.decrypt(currentCred.encrypted_data, monoKey));

    // Merge with updates
    const updatedData = {
      username: credential.username || currentDecrypted.username,
      password: credential.password || currentDecrypted.password,
      recoveryEmail: credential.recoveryEmail || currentDecrypted.recoveryEmail,
      recoveryMobile: credential.recoveryMobile || currentDecrypted.recoveryMobile,
      twoFactorCodes: credential.twoFactorCodes || currentDecrypted.twoFactorCodes
    };

    const encryptedData = CryptoUtils.encrypt(JSON.stringify(updatedData), monoKey);

    const updateFields: any = { encrypted_data: encryptedData };
    if (credential.accountName) updateFields.account_name = credential.accountName;
    if (credential.icon) updateFields.icon = credential.icon;

    const { error } = await supabase
      .from('credentials')
      .update(updateFields)
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) throw error;
  }

  static async deleteCredential(id: string): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { error } = await supabase
      .from('credentials')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) throw error;
  }

  static async updateUserProfile(updates: {
    firstName?: string;
    lastName?: string;
    phoneNumber?: string;
  }): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const updateFields: any = {};
    if (updates.firstName) updateFields.first_name = updates.firstName;
    if (updates.lastName) updateFields.last_name = updates.lastName;
    if (updates.phoneNumber !== undefined) updateFields.phone_number = updates.phoneNumber;

    const { error } = await supabase
      .from('user_profiles')
      .update(updateFields)
      .eq('id', user.id);

    if (error) throw error;
  }

  static async updateMonoPasswordHash(monoKeyHash: string): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { error } = await supabase
      .from('user_profiles')
      .update({ mono_password_hash: monoKeyHash })
      .eq('id', user.id);

    if (error) throw error;
  }

  static async getUserProfile() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data: profile, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (error) throw error;
    return profile;
  }
}