import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  auth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
} from '../config/firebase';

const USER_STORAGE_KEY = '@ChatKu:user';

export interface StoredUser {
  email: string;
  displayName: string;
  uid: string;
}

/**
 * Register a new user with email and password
 */
export const registerUser = async (
  email: string,
  password: string,
  displayName: string,
): Promise<StoredUser> => {
  try {
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      email,
      password,
    );
    const user: StoredUser = {
      email: userCredential.user.email || email,
      displayName: displayName,
      uid: userCredential.user.uid,
    };
    // Save user to local storage for auto-login
    await saveUserToStorage(user);
    return user;
  } catch (error: any) {
    throw new Error(getAuthErrorMessage(error.code));
  }
};

/**
 * Login user with email and password
 */
export const loginUser = async (
  email: string,
  password: string,
): Promise<StoredUser> => {
  try {
    const userCredential = await signInWithEmailAndPassword(
      auth,
      email,
      password,
    );
    // Try to get stored user for displayName, or use email prefix
    const storedUser = await getUserFromStorage();
    const displayName = storedUser?.displayName || userCredential.user.displayName || email.split('@')[0];
    const user: StoredUser = {
      email: userCredential.user.email || email,
      displayName: displayName,
      uid: userCredential.user.uid,
    };
    // Save user to local storage for auto-login
    await saveUserToStorage(user);
    return user;
  } catch (error: any) {
    throw new Error(getAuthErrorMessage(error.code));
  }
};

/**
 * Logout user
 */
export const logoutUser = async (): Promise<void> => {
  try {
    await signOut(auth);
    await removeUserFromStorage();
  } catch (error: any) {
    throw new Error('Gagal logout. Silakan coba lagi.');
  }
};

/**
 * Save user to AsyncStorage for auto-login
 */
export const saveUserToStorage = async (user: StoredUser): Promise<void> => {
  try {
    await AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
  } catch (error) {
    console.error('Error saving user to storage:', error);
  }
};

/**
 * Get user from AsyncStorage for auto-login
 */
export const getUserFromStorage = async (): Promise<StoredUser | null> => {
  try {
    const userJson = await AsyncStorage.getItem(USER_STORAGE_KEY);
    if (userJson) {
      return JSON.parse(userJson) as StoredUser;
    }
    return null;
  } catch (error) {
    console.error('Error getting user from storage:', error);
    return null;
  }
};

/**
 * Remove user from AsyncStorage on logout
 */
export const removeUserFromStorage = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(USER_STORAGE_KEY);
  } catch (error) {
    console.error('Error removing user from storage:', error);
  }
};

/**
 * Convert Firebase auth error codes to user-friendly messages
 */
const getAuthErrorMessage = (errorCode: string): string => {
  switch (errorCode) {
    case 'auth/email-already-in-use':
      return 'Email sudah terdaftar. Silakan login.';
    case 'auth/invalid-email':
      return 'Format email tidak valid.';
    case 'auth/operation-not-allowed':
      return 'Registrasi tidak diizinkan. Hubungi admin.';
    case 'auth/weak-password':
      return 'Password terlalu lemah. Minimal 6 karakter.';
    case 'auth/user-disabled':
      return 'Akun ini telah dinonaktifkan.';
    case 'auth/user-not-found':
      return 'Email tidak terdaftar. Silakan register.';
    case 'auth/wrong-password':
      return 'Password salah.';
    case 'auth/invalid-credential':
      return 'Email atau password salah.';
    case 'auth/too-many-requests':
      return 'Terlalu banyak percobaan. Coba lagi nanti.';
    case 'auth/network-request-failed':
      return 'Tidak ada koneksi internet.';
    default:
      return 'Terjadi kesalahan. Silakan coba lagi.';
  }
};
