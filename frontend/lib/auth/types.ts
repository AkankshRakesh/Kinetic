export type AuthUser = {
  id: string;
  name: string;
  email: string;
};

export type AuthSession = {
  accessToken?: string;
  expiresAt: number;
  user: AuthUser;
};

export type LoginPayload = {
  email: string;
  password: string;
};

export type RegisterPayload = {
  name: string;
  email: string;
  password: string;
};

export type AuthResponse = {
  session: AuthSession;
};

export type AuthAdapter = {
  getSession: () => Promise<AuthSession | null>;
  login: (payload: LoginPayload) => Promise<AuthResponse>;
  register: (payload: RegisterPayload) => Promise<AuthResponse>;
  logout: () => Promise<void>;
};
