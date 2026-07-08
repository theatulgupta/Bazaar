import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { jwtDecode } from 'jwt-decode';

interface AuthState {
  userId: string | null;
  token: string | null;
  setToken: (token: string) => Promise<void>;
  logout: () => Promise<void>;
  loadFromStorage: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  userId: null,
  token: null,

  setToken: async (token) => {
    await AsyncStorage.setItem('authToken', token);
    const decoded = jwtDecode<{ userId: string }>(token);
    set({ token, userId: decoded.userId });
  },

  logout: async () => {
    await AsyncStorage.removeItem('authToken');
    set({ token: null, userId: null });
  },

  // explicitly returns Promise<void> so callers can await / .finally()
  loadFromStorage: (): Promise<void> =>
    AsyncStorage.getItem('authToken').then((token) => {
      if (!token) return;
      try {
        const decoded = jwtDecode<{ userId: string; exp?: number }>(token);
        // discard expired tokens silently
        if (decoded.exp && decoded.exp * 1000 < Date.now()) {
          AsyncStorage.removeItem('authToken');
          return;
        }
        set({ token, userId: decoded.userId });
      } catch {
        AsyncStorage.removeItem('authToken');
      }
    }),
}));
