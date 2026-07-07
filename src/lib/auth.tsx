import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { getUserRoles } from "./auth-service";

export type Role = "admin" | "pharmacist" | "patient";

interface DemoSession {
  user: User;
  roles: Role[];
}

interface AuthContextValue {
  user: User | null;
  session: Session | null;
  loading: boolean;
  roles: Role[];
  isStaff: boolean;
  isAdmin: boolean;
  isDemo: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);
const DEMO_STORAGE_KEY = "demo_session";

function loadDemoSession(): DemoSession | null {
  try {
    const raw = localStorage.getItem(DEMO_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as DemoSession) : null;
  } catch {
    return null;
  }
}

function saveDemoSession(session: DemoSession) {
  localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(session));
}

function clearDemoSession() {
  localStorage.removeItem(DEMO_STORAGE_KEY);
}

// Wraps the whole app in auth context — Supabase + demo sessions.
export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDemo, setIsDemo] = useState(false);

  useEffect(() => {
    const demo = loadDemoSession();
    if (demo) {
      setUser(demo.user);
      setRoles(demo.roles);
      setIsDemo(true);
      setLoading(false);
    }
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      if (loadDemoSession()) return;
      setSession(s);
      setUser(s?.user ?? null);
      if (s?.user) {
        setTimeout(() => loadRoles(s.user.id), 0);
      } else {
        setRoles([]);
      }
    });
    if (!demo) {
      supabase.auth
        .getSession()
        .then(({ data }) => {
          setSession(data.session);
          setUser(data.session?.user ?? null);
          if (data.session?.user) loadRoles(data.session.user.id);
          setLoading(false);
        })
        .catch(() => setLoading(false));
    }

    const onDemoChanged = () => {
      const d = loadDemoSession();
      if (d) {
        setUser(d.user);
        setRoles(d.roles);
        setIsDemo(true);
        setLoading(false);
      } else {
        setUser(null);
        setRoles([]);
        setIsDemo(false);
        setLoading(false);
      }
    };
    window.addEventListener("demo-session-changed", onDemoChanged);
    return () => {
      sub.subscription.unsubscribe();
      window.removeEventListener("demo-session-changed", onDemoChanged);
    };
  }, []);

  async function loadRoles(uid: string) {
    const roles = await getUserRoles();
    setRoles(roles as Role[]);
  }

  const signOut = async () => {
    if (isDemo) {
      clearDemoSession();
      setIsDemo(false);
      setUser(null);
      setRoles([]);
    }
    await supabase.auth.signOut();
  };

  const isStaff = roles.includes("pharmacist") || roles.includes("admin");
  const isAdmin = roles.includes("admin");

  return (
    <AuthContext.Provider
      value={{ user, session, loading, roles, isStaff, isAdmin, isDemo, signOut }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// Saves demo session and notifies the auth provider.
export function setDemoSession(user: User, roles: Role[]) {
  saveDemoSession({ user, roles });
  window.dispatchEvent(new CustomEvent("demo-session-changed"));
}

// Clears demo session from localStorage.
export function clearDemoSessionGlobal() {
  localStorage.removeItem(DEMO_STORAGE_KEY);
  window.dispatchEvent(new CustomEvent("demo-session-changed"));
}

// Access auth context from anywhere.
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
