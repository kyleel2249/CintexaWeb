import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

const TOKEN_KEY = "cintexa_auth_token";
const USER_KEY = "cintexa_auth_user";

export type CintexaUser = {
  id: string;
  email: string;
  fullName: string;
};

type AuthContextValue = {
  user: CintexaUser | null;
  userId: string | null;
  isSignedIn: boolean;
  isLoaded: boolean;
  getToken: () => Promise<string | null>;
  signUp: (input: {
    fullName: string;
    email: string;
    password: string;
    phone?: string;
    company?: string;
    role?: string;
  }) => Promise<{ ok: true } | { ok: false; error: string }>;
  signIn: (email: string, password: string) => Promise<{ ok: true } | { ok: false; error: string }>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function readStoredUser(): CintexaUser | null {
  try {
    const raw = localStorage.getItem(USER_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as CintexaUser;
  } catch {
    return null;
  }
}

function storeSession(token: string, user: CintexaUser) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

function clearSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

async function postAuth<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = (await res.json().catch(() => ({}))) as T & { error?: string };
  if (!res.ok) {
    throw new Error((data as { error?: string }).error || `Request failed (${res.status})`);
  }
  return data;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<CintexaUser | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY);
    const stored = readStoredUser();
    if (!token || !stored) {
      setIsLoaded(true);
      return;
    }
    setUser(stored);
    // Validate session in background
    fetch("/api/auth/me", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(async (res) => {
        if (!res.ok) {
          clearSession();
          setUser(null);
          return;
        }
        const data = (await res.json()) as { user: CintexaUser };
        setUser(data.user);
        localStorage.setItem(USER_KEY, JSON.stringify(data.user));
      })
      .catch(() => {
        /* offline — keep cached session */
      })
      .finally(() => setIsLoaded(true));
  }, []);

  const getToken = useCallback(async () => {
    const token = localStorage.getItem(TOKEN_KEY);
    const u = readStoredUser();
    if (!token) return null;
    // API server accepts "userId:sessionToken" so routes receive a stable userId
    return u?.id ? `${u.id}:${token}` : token;
  }, []);

  const signUp = useCallback(
    async (input: {
      fullName: string;
      email: string;
      password: string;
      phone?: string;
      company?: string;
      role?: string;
    }) => {
      try {
        const data = await postAuth<{ token: string; user: CintexaUser }>("/api/auth/signup", input);
        storeSession(data.token, data.user);
        setUser(data.user);
        return { ok: true as const };
      } catch (e) {
        return { ok: false as const, error: e instanceof Error ? e.message : "Signup failed" };
      }
    },
    [],
  );

  const signIn = useCallback(async (email: string, password: string) => {
    try {
      const data = await postAuth<{ token: string; user: CintexaUser }>("/api/auth/login", {
        email,
        password,
      });
      storeSession(data.token, data.user);
      setUser(data.user);
      return { ok: true as const };
    } catch (e) {
      return { ok: false as const, error: e instanceof Error ? e.message : "Login failed" };
    }
  }, []);

  const signOut = useCallback(async () => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (token) {
      await fetch("/api/auth/logout", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      }).catch(() => undefined);
    }
    clearSession();
    setUser(null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      userId: user?.id ?? null,
      isSignedIn: Boolean(user),
      isLoaded,
      getToken,
      signUp,
      signIn,
      signOut,
    }),
    [user, isLoaded, getToken, signUp, signIn, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
}

/** Compatibility helpers for components that previously used Clerk hooks */
export function useUser() {
  const { user, isLoaded, isSignedIn } = useAuth();
  return {
    isLoaded,
    isSignedIn,
    user: user
      ? {
          id: user.id,
          primaryEmailAddress: { emailAddress: user.email },
          fullName: user.fullName,
          firstName: user.fullName.split(" ")[0] || user.fullName,
        }
      : null,
  };
}
