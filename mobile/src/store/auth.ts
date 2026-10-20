import { create } from 'zustand';
import { supabase } from '../lib/supabase';

interface AuthState {
  isAuthenticated: boolean;
  signIn: (email: string, password: string) => Promise<string | null>;
  signOut: () => Promise<void>;
}

export const useAuth = create<AuthState>((set) => {
  supabase.auth.getSession().then(({ data }) => set({ isAuthenticated: !!data.session }));
  supabase.auth.onAuthStateChange((_event, session) => set({ isAuthenticated: !!session }));

  return {
    isAuthenticated: false,
    signIn: async (email, password) => {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      return error ? error.message : null;
    },
    signOut: async () => {
      await supabase.auth.signOut();
      set({ isAuthenticated: false });
    },
  };
});