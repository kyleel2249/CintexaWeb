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

// In-memory fallback so sign-up / log-in still work when localStorage is unavailable
// (Safari private mode, blocked storage). The session then lasts until the tab closes.
let memoryToken: string | null = null;
let memoryUser: CintexaUser | null = null;

function readToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY) ?? memoryToken;
  } catch {
    return memoryToken;
  }
}

function readStoredUser(): CintexaUser | null {
  try {
    const raw = localStorage.getItem(USER_KEY);
    if (!raw) return memoryUser;
    return JSON.parse(raw) as CintexaUser;
  } catch {
    return memoryUser;
  }
}

function storeSession(token: string, user: CintexaUser) {
  memoryToken = token;
  memoryUser = user;
  try {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  } catch {
    /* storage unavailable — memory fallback above keeps the session alive */
  }
}

function clearSession() {
  memoryToken = null;
  memoryUser = null;
  try {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  } catch {
    /* ignore */
  }
}

async function postAuth<T>(path: string, body: unknown): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 20_000);
  let res: Response;
  try {
    res = await fetch(path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
  } catch (e) {
    const aborted = e instanceof DOMException && e.name === "AbortError";
    throw new Error(
      aborted
        ? "The request timed out. Check your connection and try again."
        : "Could not reach CINTEXA. Check your connection and try again.",
      { cause: e },
    );
  } finally {
    clearTimeout(timer);
  }
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
    const token = readToken();
    const stored = readStoredUser();
    if (!token || !stored) {
      setIsLoaded(true);
      return;
    }
    setUser(stored);
    // Validate the session in the background. Never let a slow/hung request keep the
    // page on "Loading…": abort after 8s and fall back to the cached session.
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 8_000);
    fetch("/api/auth/me", {
      headers: { Authorization: `Bearer ${token}` },
      signal: controller.signal,
    })
      .then(async (res) => {
        // Only an explicit auth rejection ends the session. A 5xx / 429 must not log users out.
        if (res.status === 401 || res.status === 403) {
          clearSession();
          setUser(null);
          return;
        }
        if (!res.ok) return;
        const data = (await res.json()) as { user: CintexaUser };
        setUser(data.user);
        storeSession(token, data.user);
      })
      .catch(() => {
        /* offline / timeout — keep cached session */
      })
      .finally(() => {
        clearTimeout(timer);
        setIsLoaded(true);
      });
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, []);

  const getToken = useCallback(async () => {
    const token = readToken();
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
    const token = readToken();
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


/** Request a 6-digit recovery code (email + SMS when available). */
export async function requestPasswordReset(email: string): Promise<
  | { ok: true; message: string; channels?: { email: boolean; sms: boolean }; hasPhoneOnFile?: boolean }
  | { ok: false; error: string }
> {
  try {
    const data = await postAuth<{
      ok: boolean;
      message: string;
      channels?: { email: boolean; sms: boolean };
      hasPhoneOnFile?: boolean;
    }>("/api/auth/forgot-password", { email: email.trim().toLowerCase() });
    return {
      ok: true,
      message: data.message,
      channels: data.channels,
      hasPhoneOnFile: data.hasPhoneOnFile,
    };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Could not send recovery code" };
  }
}

/** Verify recovery code and set a new password. */
export async function resetPasswordWithCode(
  email: string,
  code: string,
  newPassword: string,
): Promise<{ ok: true; message: string } | { ok: false; error: string }> {
  try {
    const data = await postAuth<{ ok: boolean; message: string }>("/api/auth/reset-password", {
      email: email.trim().toLowerCase(),
      code: code.trim(),
      newPassword,
    });
    return { ok: true, message: data.message || "Password updated." };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Could not reset password" };
  }
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
