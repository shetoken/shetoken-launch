import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export interface SheProfile {
  id: string;
  display_name: string | null;
  email: string | null;
  region: string | null;
  saved_countries: string[];
  newsletter_opt_in: boolean | null;
  newsletter_tier: string | null;
  org_type: string | null;
  company: string | null;
  job_title: string | null;
  bio: string | null;
  created_at: string;
  updated_at: string | null;
}

interface AuthContextType {
  session: Session | null;
  user: User | null;
  profile: SheProfile | null;
  loading: boolean;
  // Auth actions
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  // Modal control — any component can open the auth modal
  openAuth: (tab?: "signin" | "signup") => void;
  closeAuth: () => void;
  authOpen: boolean;
  authTab: "signin" | "signup";
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<SheProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [authOpen, setAuthOpen] = useState(false);
  const [authTab, setAuthTab] = useState<"signin" | "signup">("signin");

  useEffect(() => {
    // Initialise from existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) fetchProfile(session.user.id);
      setLoading(false);
    });

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user) {
          fetchProfile(session.user.id);
        } else {
          setProfile(null);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  async function fetchProfile(userId: string) {
    const { data } = await supabase
      .from("she_profiles")
      .select("*")
      .eq("id", userId)
      .maybeSingle();
    if (data) setProfile(data as SheProfile);
  }

  async function signIn(email: string, password: string) {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (!error) setAuthOpen(false);
    return { error: error?.message ?? null };
  }

  async function signUp(email: string, password: string, fullName: string) {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { display_name: fullName },
        emailRedirectTo: `${window.location.origin}/`,
      },
    });
    return { error: error?.message ?? null };
  }

  async function signOut() {
    await supabase.auth.signOut();
  }

  async function signInWithGoogle() {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/` },
    });
  }

  function openAuth(tab: "signin" | "signup" = "signin") {
    setAuthTab(tab);
    setAuthOpen(true);
  }

  function closeAuth() {
    setAuthOpen(false);
  }

  return (
    <AuthContext.Provider
      value={{
        session, user, profile, loading,
        signIn, signUp, signOut, signInWithGoogle,
        openAuth, closeAuth, authOpen, authTab,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
