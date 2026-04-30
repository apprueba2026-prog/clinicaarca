"use client";

import {
  createContext,
  useEffect,
  useState,
  useCallback,
  useRef,
  ReactNode,
} from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useSupabase } from "@/hooks/use-supabase";
import type { User } from "@supabase/supabase-js";
import type { StaffRole } from "@/lib/utils/constants";

export interface StaffProfile {
  id: string;
  role: StaffRole | "patient";
  is_active: boolean;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  phone: string | null;
  avatar_url: string | null;
}

interface AuthContextType {
  user: User | null;
  profile: StaffProfile | null;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const supabase = useSupabase();
  const queryClient = useQueryClient();
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<StaffProfile | null>(null);
  const [loading, setLoading] = useState(true);
  // Track del último user.id que vimos. Cuando cambia (login distinto en
  // la misma pestaña), limpiamos TODO el cache de TanStack Query para
  // evitar que datos de un usuario filtren al siguiente.
  // Bug detectado en v1.2: Aldrick cierra sesión, Dina entra → veía datos
  // de Aldrick en /perfil porque la queryKey ['profile-me'] estaba cacheada.
  const lastUserIdRef = useRef<string | null>(null);

  const fetchProfile = useCallback(
    async (userId: string) => {
      const { data } = await supabase
        .from("profiles")
        .select(
          "id, role, is_active, first_name, last_name, email, phone, avatar_url"
        )
        .eq("id", userId)
        .maybeSingle();
      setProfile((data as StaffProfile | null) ?? null);
    },
    [supabase]
  );

  useEffect(() => {
    const initializeAuth = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const u = session?.user ?? null;
      setUser(u);
      lastUserIdRef.current = u?.id ?? null;
      if (u) await fetchProfile(u.id);
      setLoading(false);
    };

    initializeAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      const u = session?.user ?? null;
      const prevId = lastUserIdRef.current;
      const newId = u?.id ?? null;
      // Si cambió el user.id (otro login en la misma pestaña, signOut, etc.)
      // limpiar TODO el cache para no servir datos del usuario anterior.
      if (prevId !== newId) {
        queryClient.clear();
      }
      lastUserIdRef.current = newId;
      setUser(u);
      if (u) {
        void fetchProfile(u.id);
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase, fetchProfile, queryClient]);

  const signOut = useCallback(async () => {
    queryClient.clear();
    await supabase.auth.signOut();
  }, [supabase, queryClient]);

  const refreshProfile = useCallback(async () => {
    if (user) await fetchProfile(user.id);
  }, [user, fetchProfile]);

  return (
    <AuthContext.Provider
      value={{ user, profile, loading, signOut, refreshProfile }}
    >
      {children}
    </AuthContext.Provider>
  );
}
