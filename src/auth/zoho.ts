import * as AuthSession from 'expo-auth-session';
import * as SecureStore from 'expo-secure-store';
import type { ZohoProfile, ZohoSession } from '../types';

/**
 * Zoho Accounts OAuth 2.0 (authorization code + PKCE).
 *
 * Credentials are injected at build time from EXPO_PUBLIC_* env vars so that
 * nothing is committed to the repository. See .env.example and the README.
 */
const CLIENT_ID = process.env.EXPO_PUBLIC_ZOHO_CLIENT_ID || '';
const CLIENT_SECRET = process.env.EXPO_PUBLIC_ZOHO_CLIENT_SECRET || '';
const DATA_CENTER = (process.env.EXPO_PUBLIC_ZOHO_DC || 'in').toLowerCase();

export const ZOHO_ACCOUNTS = `https://accounts.zoho.${DATA_CENTER}`;
export const ZOHO_SCOPE = 'AaaServer.profile.Read';
export const ZOHO_REDIRECT_URI = AuthSession.makeRedirectUri({ scheme: 'nijatva', path: 'oauth' });
export const zohoConfigured = CLIENT_ID.length > 0;

const SESSION_KEY = 'nijatva.zoho.session';

const discovery = {
  authorizationEndpoint: `${ZOHO_ACCOUNTS}/oauth/v2/auth`,
  tokenEndpoint: `${ZOHO_ACCOUNTS}/oauth/v2/token`,
  revocationEndpoint: `${ZOHO_ACCOUNTS}/oauth/v2/token/revoke`,
};

interface TokenResponse {
  access_token?: string;
  refresh_token?: string;
  expires_in?: number;
  api_domain?: string;
  location?: string;
  error?: string;
}

export async function loadSession(): Promise<ZohoSession | null> {
  try {
    const raw = await SecureStore.getItemAsync(SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as ZohoSession;
    if (!parsed?.accessToken) return null;
    return parsed;
  } catch {
    return null;
  }
}

async function persist(session: ZohoSession | null): Promise<void> {
  try {
    if (session) {
      await SecureStore.setItemAsync(SESSION_KEY, JSON.stringify(session));
    } else {
      await SecureStore.deleteItemAsync(SESSION_KEY);
    }
  } catch {
    // keychain unavailable (e.g. web) — session stays in memory only
  }
}

async function fetchProfile(accessToken: string): Promise<ZohoProfile> {
  const response = await fetch(`${ZOHO_ACCOUNTS}/oauth/user/info`, {
    headers: { Authorization: `Zoho-oauthtoken ${accessToken}` },
  });
  if (!response.ok) throw new Error(`Could not load Zoho profile (${response.status})`);
  const info = (await response.json()) as {
    ZUID?: number | string;
    Email?: string;
    Display_Name?: string;
    First_Name?: string;
    Last_Name?: string;
  };
  const name =
    info.Display_Name ?? [info.First_Name, info.Last_Name].filter(Boolean).join(' ') ?? info.Email ?? '';
  return {
    zuid: String(info.ZUID ?? ''),
    email: info.Email ?? '',
    name: name || info.Email || 'Zoho account',
  };
}

function assertConfigured(): void {
  if (!zohoConfigured) {
    throw new Error('Zoho sign-in is not configured in this build');
  }
}

export async function signIn(): Promise<ZohoSession> {
  assertConfigured();

  const request = new AuthSession.AuthRequest({
    clientId: CLIENT_ID,
    scopes: [ZOHO_SCOPE],
    redirectUri: ZOHO_REDIRECT_URI,
    responseType: AuthSession.ResponseType.Code,
    usePKCE: true,
    extraParams: { access_type: 'offline', prompt: 'consent' },
  });

  const result = await request.promptAsync(discovery);

  if (result.type === 'dismiss' || result.type === 'cancel') {
    throw new Error('Sign-in cancelled');
  }
  if (result.type !== 'success') {
    throw new Error(result.type === 'error' ? `Zoho error: ${result.error?.message ?? 'unknown'}` : 'Sign-in failed');
  }
  if (result.params.error) {
    throw new Error(`Zoho error: ${result.params.error}`);
  }

  const code = result.params.code;
  if (!code) throw new Error('Zoho did not return an authorization code');

  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    client_id: CLIENT_ID,
    client_secret: CLIENT_SECRET,
    redirect_uri: ZOHO_REDIRECT_URI,
    code,
    code_verifier: request.codeVerifier ?? '',
  });

  const tokenResponse = await fetch(discovery.tokenEndpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  });
  const tokens = (await tokenResponse.json()) as TokenResponse;

  if (!tokens.access_token) {
    throw new Error(tokens.error ? `Zoho error: ${tokens.error}` : 'Token exchange failed');
  }

  const profile = await fetchProfile(tokens.access_token);
  const session: ZohoSession = {
    accessToken: tokens.access_token,
    refreshToken: tokens.refresh_token ?? null,
    expiresAt: Date.now() + (tokens.expires_in ?? 3600) * 1000,
    apiDomain: tokens.api_domain ?? `https://www.zohoapis.${DATA_CENTER}`,
    location: tokens.location ?? DATA_CENTER,
    profile,
  };
  await persist(session);
  return session;
}

export async function refreshSession(session: ZohoSession): Promise<ZohoSession> {
  assertConfigured();
  if (!session.refreshToken) throw new Error('No refresh token — sign in again');

  const body = new URLSearchParams({
    grant_type: 'refresh_token',
    client_id: CLIENT_ID,
    client_secret: CLIENT_SECRET,
    refresh_token: session.refreshToken,
  });

  const response = await fetch(discovery.tokenEndpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  });
  const tokens = (await response.json()) as TokenResponse;
  if (!tokens.access_token) {
    throw new Error(tokens.error ? `Zoho error: ${tokens.error}` : 'Token refresh failed');
  }

  const next: ZohoSession = {
    ...session,
    accessToken: tokens.access_token,
    expiresAt: Date.now() + (tokens.expires_in ?? 3600) * 1000,
    apiDomain: tokens.api_domain ?? session.apiDomain,
  };
  await persist(next);
  return next;
}

export async function signOut(session: ZohoSession | null): Promise<void> {
  if (session?.refreshToken) {
    try {
      await fetch(
        `${discovery.revocationEndpoint}?token=${encodeURIComponent(session.refreshToken)}`,
        { method: 'POST' },
      );
    } catch {
      // revocation is best effort
    }
  }
  await persist(null);
}
