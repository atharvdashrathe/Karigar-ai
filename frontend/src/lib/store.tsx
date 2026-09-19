import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { artisan as defaultArtisan } from "@/data/mockData";

export type Role = "artisan" | "buyer" | "admin";

export type SessionUser = {
  id?: string;
  name: string;
  business: string;
  craft: string;
  location: string;
  state?: string;
  village?: string;
  bio?: string;
  language: string;
  avatar: string;
  since: string;
  isVerified?: boolean;
  collective?: string;
};

type AppValue = {
  user: SessionUser;
  role: Role;
  signIn: (user: Partial<SessionUser>) => void;
  signOut: () => void;
  updateUser: (patch: Partial<SessionUser>) => void;
  setRole: (role: Role) => void;
};

const AppContext = createContext<AppValue | null>(null);

const STORAGE_KEY = "karigar_artisan_profile";
const ROLE_KEY = "karigar_user_role";

function getInitialUser(): SessionUser {
  if (typeof window === "undefined") return defaultArtisan;
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      return { ...defaultArtisan, ...JSON.parse(saved) };
    }
  } catch {}
  return defaultArtisan;
}

function getInitialRole(): Role {
  if (typeof window === "undefined") return "artisan";
  try {
    const saved = localStorage.getItem(ROLE_KEY);
    if (saved && (saved === "artisan" || saved === "buyer" || saved === "admin")) {
      return saved as Role;
    }
  } catch {}
  return "artisan";
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SessionUser>(getInitialUser);
  const [role, setRoleState] = useState<Role>(getInitialRole);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    } catch {}
  }, [user]);

  const setRole = useCallback((newRole: Role) => {
    setRoleState(newRole);
    try {
      localStorage.setItem(ROLE_KEY, newRole);
    } catch {}
  }, []);

  const signIn = useCallback((next: Partial<SessionUser>) => {
    setUser((prev) => {
      const updated = { ...prev, ...next };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch {}
      return updated;
    });
  }, []);

  const signOut = useCallback(() => {
    // Keep saved profile locally
  }, []);

  const updateUser = useCallback((patch: Partial<SessionUser>) => {
    setUser((prev) => {
      const updated = { ...prev, ...patch };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch {}
      return updated;
    });
  }, []);

  const value = useMemo(
    () => ({ user, role, signIn, signOut, updateUser, setRole }),
    [user, role, signIn, signOut, updateUser, setRole],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used inside AppProvider");
  return ctx;
}
