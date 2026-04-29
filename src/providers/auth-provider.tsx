"use client";

import { createContext, useEffect, useState, ReactNode } from "react";
import { useSupabase } from "@/hooks/use-supabase";
import type { User } from "@supabase/supabase-js";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const supabase = useSupabase();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Initial local state check (fast, no network)
    const initializeAuth = async () => {
      // Using getSession instead of getUser for the initial load is safer
      // for concurrent rendering and usually fast enough.
      // We rely on the server side to validate tokens securely where needed.
      const {
        data: { session },
      } = await supabase.auth.getSession();
      
      setUser(session?.user ?? null);
      setLoading(false);
      
      // We can do a getUser asynchronously if we want to ensure validation
      // but since the server validates SSR, client session is mostly for UI.
    };

    initializeAuth();

    // 2. Listen for auth changes (login, logout, refresh)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase]);

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}
