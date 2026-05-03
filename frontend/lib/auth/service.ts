import type {
  AuthAdapter,
  AuthResponse,
  AuthSession,
  AuthUser,
  LoginPayload,
  RegisterPayload,
} from "./types";

const AUTH_MODE = process.env.NEXT_PUBLIC_AUTH_MODE ?? "mock";
const AUTH_BACKEND = process.env.NEXT_PUBLIC_AUTH_BACKEND ?? "laravel-token";
const AUTH_API_BASE_URL = (process.env.NEXT_PUBLIC_AUTH_API_BASE_URL ?? "").replace(/\/$/, "");

const LOGIN_ENDPOINT =
  process.env.NEXT_PUBLIC_AUTH_LOGIN_ENDPOINT ??
  (AUTH_BACKEND === "generic" ? "/api/auth/login" : "/api/auth/login");
const REGISTER_ENDPOINT =
  process.env.NEXT_PUBLIC_AUTH_REGISTER_ENDPOINT ??
  (AUTH_BACKEND === "generic" ? "/api/auth/register" : "/api/auth/register");
const LOGOUT_ENDPOINT =
  process.env.NEXT_PUBLIC_AUTH_LOGOUT_ENDPOINT ??
  (AUTH_BACKEND === "generic" ? "/api/auth/logout" : "/api/auth/logout");
const USER_ENDPOINT = process.env.NEXT_PUBLIC_AUTH_USER_ENDPOINT ?? "/api/auth/user";

const INCLUDE_CREDENTIALS = false;

const IS_LARAVEL_SANCTUM = false;
const IS_LARAVEL_TOKEN = AUTH_BACKEND === "laravel-token";

const SESSION_STORAGE_KEY = "kinetic.auth.session";
const USERS_STORAGE_KEY = "kinetic.auth.users";

type StoredUser = AuthUser & {
  password: string;
};

type ApiAuthResponse = {
  token?: string;
  expiresAt?: number;
  user?: AuthUser;
  message?: string;
};

function resolveUrl(pathOrUrl: string): string {
  if (/^https?:\/\//i.test(pathOrUrl)) {
    return pathOrUrl;
  }

  if (!AUTH_API_BASE_URL) {
    return pathOrUrl;
  }

  const cleanPath = pathOrUrl.startsWith("/") ? pathOrUrl : `/${pathOrUrl}`;
  return `${AUTH_API_BASE_URL}${cleanPath}`;
}

function readJson<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") {
    return fallback;
  }

  const raw = window.localStorage.getItem(key);
  if (!raw) {
    return fallback;
  }

  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeJson<T>(key: string, value: T): void {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(key, JSON.stringify(value));
}

function removeValue(key: string): void {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(key);
}

function readCookie(name: string): string | null {
  if (typeof document === "undefined") {
    return null;
  }

  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? match[1] : null;
}

function buildHeaders(accessToken?: string): Headers {
  const headers = new Headers({ "Content-Type": "application/json" });

  if (accessToken) {
    headers.set("Authorization", `Bearer ${accessToken}`);
  }

  return headers;
}

function getErrorMessage(responseData: unknown, fallbackMessage: string): string {
  if (!responseData || typeof responseData !== "object") {
    return fallbackMessage;
  }

  const maybeMessage = (responseData as { message?: unknown }).message;
  if (typeof maybeMessage === "string" && maybeMessage.trim()) {
    return maybeMessage;
  }

  const maybeErrors = (responseData as { errors?: unknown }).errors;
  if (maybeErrors && typeof maybeErrors === "object") {
    const firstEntry = Object.values(maybeErrors as Record<string, unknown>)[0];
    if (Array.isArray(firstEntry) && typeof firstEntry[0] === "string") {
      return firstEntry[0];
    }
    if (typeof firstEntry === "string") {
      return firstEntry;
    }
  }

  return fallbackMessage;
}

function normalizeUser(rawUser: unknown): AuthUser | null {
  if (!rawUser || typeof rawUser !== "object") {
    return null;
  }

  const candidate = rawUser as Record<string, unknown>;
  const id = candidate.id;
  const name = candidate.name;
  const email = candidate.email;

  if ((typeof id !== "string" && typeof id !== "number") || typeof name !== "string" || typeof email !== "string") {
    return null;
  }

  return {
    id: String(id),
    name,
    email,
  };
}

function normalizeAuthPayload(responseData: unknown): ApiAuthResponse {
  if (!responseData || typeof responseData !== "object") {
    return {};
  }

  const root = responseData as Record<string, unknown>;
  const data = (root.data && typeof root.data === "object" ? root.data : root) as Record<string, unknown>;

  const token = [data.access_token, data.accessToken, data.token].find((value) => typeof value === "string") as
    | string
    | undefined;

  const expiresAtRaw = [data.expiresAt, data.expires_at].find((value) => typeof value === "number") as
    | number
    | undefined;
  const expiresIn = data.expires_in;
  const expiresAt =
    expiresAtRaw ??
    (typeof expiresIn === "number" && Number.isFinite(expiresIn) ? Date.now() + expiresIn * 1000 : undefined);

  const user = normalizeUser(data.user) ?? undefined;

  return {
    token,
    expiresAt,
    user,
    message: typeof root.message === "string" ? root.message : undefined,
  };
}

async function fetchCurrentUser(accessToken?: string): Promise<AuthUser | null> {
  const headers = new Headers();
  if (accessToken) {
    headers.set("Authorization", `Bearer ${accessToken}`);
  }

  const response = await fetch(resolveUrl(USER_ENDPOINT), {
    method: "GET",
    headers,
  });

  if (!response.ok) {
    return null;
  }

  const responseData = (await response.json().catch(() => null)) as unknown;
  if (!responseData || typeof responseData !== "object") {
    return null;
  }

  const root = responseData as Record<string, unknown>;
  return normalizeUser(root.user ?? root.data ?? root);
}

async function parseApiResponse(response: Response, fallbackMessage: string): Promise<ApiAuthResponse> {
  const responseData = (await response.json().catch(() => null)) as unknown;
  const normalized = normalizeAuthPayload(responseData);

  if (!response.ok) {
    throw new Error(getErrorMessage(responseData, fallbackMessage));
  }

  return normalized;
}

function toAuthResponse(payload: ApiAuthResponse): AuthResponse {
  if (!payload.user) {
    throw new Error("Could not resolve authenticated user from API response.");
  }

  return {
    session: {
      accessToken: payload.token,
      expiresAt: payload.expiresAt ?? Date.now() + 1000 * 60 * 60 * 24,
      user: payload.user,
    },
  };
}

function generateSession(user: AuthUser): AuthSession {
  return {
    accessToken: crypto.randomUUID(),
    expiresAt: Date.now() + 1000 * 60 * 60 * 24,
    user,
  };
}

const mockAdapter: AuthAdapter = {
  async getSession() {
    const session = readJson<AuthSession | null>(SESSION_STORAGE_KEY, null);
    if (!session) {
      return null;
    }

    if (session.expiresAt < Date.now()) {
      removeValue(SESSION_STORAGE_KEY);
      return null;
    }

    return session;
  },

  async login(payload) {
    const users = readJson<StoredUser[]>(USERS_STORAGE_KEY, []);
    const match = users.find((user) => user.email.toLowerCase() === payload.email.toLowerCase());

    if (!match || match.password !== payload.password) {
      throw new Error("Invalid email or password.");
    }

    const user: AuthUser = {
      id: match.id,
      name: match.name,
      email: match.email,
    };

    const session = generateSession(user);
    writeJson(SESSION_STORAGE_KEY, session);

    return { session };
  },

  async register(payload) {
    const users = readJson<StoredUser[]>(USERS_STORAGE_KEY, []);
    const existing = users.find((user) => user.email.toLowerCase() === payload.email.toLowerCase());

    if (existing) {
      throw new Error("An account with this email already exists.");
    }

    const newUser: StoredUser = {
      id: crypto.randomUUID(),
      name: payload.name.trim(),
      email: payload.email.trim().toLowerCase(),
      password: payload.password,
    };

    writeJson(USERS_STORAGE_KEY, [...users, newUser]);

    const session = generateSession({
      id: newUser.id,
      name: newUser.name,
      email: newUser.email,
    });
    writeJson(SESSION_STORAGE_KEY, session);

    return { session };
  },

  async logout() {
    removeValue(SESSION_STORAGE_KEY);
  },
};

const apiAdapter: AuthAdapter = {
  async getSession() {
    const raw = readJson<AuthSession | null>(SESSION_STORAGE_KEY, null);

    if (raw && raw.expiresAt < Date.now()) {
      removeValue(SESSION_STORAGE_KEY);
      return null;
    }

    if (!raw) {
      return null;
    }

    // Verify token by fetching current user
    const user = await fetchCurrentUser(raw.accessToken);
    if (!user) {
      removeValue(SESSION_STORAGE_KEY);
      return null;
    }

    const session: AuthSession = {
      ...raw,
      user,
    };
    writeJson(SESSION_STORAGE_KEY, session);
    return session;
  },

  async login(payload) {
    const requestPayload = payload;

    const response = await fetch(resolveUrl(LOGIN_ENDPOINT), {
      method: "POST",
      headers: buildHeaders(),
      body: JSON.stringify(requestPayload),
    });

    const parsed = await parseApiResponse(response, "Login request failed.");
    if (!parsed.user) {
      parsed.user = (await fetchCurrentUser(parsed.token)) ?? undefined;
    }

    const authResponse = toAuthResponse(parsed);
    writeJson(SESSION_STORAGE_KEY, authResponse.session);
    return authResponse;
  },

  async register(payload) {
    const requestPayload = payload;

    const response = await fetch(resolveUrl(REGISTER_ENDPOINT), {
      method: "POST",
      headers: buildHeaders(),
      body: JSON.stringify(requestPayload),
    });

    const parsed = await parseApiResponse(response, "Registration request failed.");
    if (!parsed.user) {
      parsed.user = (await fetchCurrentUser(parsed.token)) ?? undefined;
    }

    const authResponse = toAuthResponse(parsed);
    writeJson(SESSION_STORAGE_KEY, authResponse.session);
    return authResponse;
  },

  async logout() {
    const session = readJson<AuthSession | null>(SESSION_STORAGE_KEY, null);
    const headers = buildHeaders(session?.accessToken);

    await fetch(resolveUrl(LOGOUT_ENDPOINT), {
      method: "POST",
      headers,
    }).catch(() => null);

    removeValue(SESSION_STORAGE_KEY);
  },
};

function getAuthAdapter(): AuthAdapter {
  return AUTH_MODE === "api" ? apiAdapter : mockAdapter;
}

export async function getSession(): Promise<AuthSession | null> {
  return getAuthAdapter().getSession();
}

export async function login(payload: LoginPayload): Promise<AuthResponse> {
  return getAuthAdapter().login(payload);
}

export async function register(payload: RegisterPayload): Promise<AuthResponse> {
  return getAuthAdapter().register(payload);
}

export async function logout(): Promise<void> {
  return getAuthAdapter().logout();
}
