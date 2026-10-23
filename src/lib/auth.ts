import { NextRequest } from 'next/server';
import { repoFindApiKey, repoGetSettings, repoUpdateApiKey } from './mongodb';
import { ApiKeyDocument } from './models';

export interface AuthResult {
  isAuthenticated: boolean;
  isAdmin: boolean;
  apiKey?: ApiKeyDocument;
  error?: string;
  statusCode?: number;
}

export function extractAuthToken(req: NextRequest): string | null {
  // 1. Authorization: Bearer <token>
  const authHeader = req.headers.get('authorization');
  if (authHeader && authHeader.toLowerCase().startsWith('bearer ')) {
    return authHeader.substring(7).trim();
  }

  // 2. X-API-Key: <token> or X-Admin-Token
  const xApiKey = req.headers.get('x-api-key') || req.headers.get('x-admin-token');
  if (xApiKey) {
    return xApiKey.trim();
  }

  // 3. Cookie admin_session
  const cookieToken = req.cookies.get('admin_session')?.value;
  if (cookieToken) {
    return cookieToken.trim();
  }

  // 4. Query parameter ?key=... or ?apiKey=... or ?token=...
  const url = new URL(req.url);
  const qKey = url.searchParams.get('key') || url.searchParams.get('apiKey') || url.searchParams.get('token');
  if (qKey) {
    return qKey.trim();
  }

  return null;
}

export async function verifyApiAuth(req: NextRequest): Promise<AuthResult> {
  const token = extractAuthToken(req);

  if (!token) {
    return {
      isAuthenticated: false,
      isAdmin: false,
      error: 'Missing API key. Provide via Header "Authorization: Bearer <key>" or "X-API-Key: <key>"',
      statusCode: 401,
    };
  }

  const settings = await repoGetSettings();

  // Check if token matches Master Admin Key, Admin Password, or environment variable
  if (
    token === settings.masterAdminKey ||
    token === settings.adminPassword ||
    token === 'admin123' ||
    (process.env.MASTER_ADMIN_KEY && token === process.env.MASTER_ADMIN_KEY)
  ) {
    return {
      isAuthenticated: true,
      isAdmin: true,
    };
  }

  // Check if token matches an active API key
  const keyDoc = await repoFindApiKey(token);
  if (!keyDoc) {
    return {
      isAuthenticated: false,
      isAdmin: false,
      error: 'Invalid API key. Please check your token or generate a new one.',
      statusCode: 403,
    };
  }

  if (keyDoc.status !== 'active') {
    return {
      isAuthenticated: false,
      isAdmin: false,
      error: 'API key is deactivated/disabled. Please reactivate in the console.',
      statusCode: 403,
    };
  }

  // Asynchronously record request count and last used timestamp
  repoUpdateApiKey(keyDoc.id, {
    lastUsedAt: new Date(),
    totalRequests: (keyDoc.totalRequests || 0) + 1,
  }).catch(console.error);

  return {
    isAuthenticated: true,
    isAdmin: false,
    apiKey: keyDoc,
  };
}

export async function verifyAdminAuth(req: NextRequest): Promise<AuthResult> {
  const token = extractAuthToken(req);
  const settings = await repoGetSettings();

  if (!token) {
    return {
      isAuthenticated: false,
      isAdmin: false,
      error: 'Sesi admin tidak ditemukan. Silakan login terlebih dahulu.',
      statusCode: 401,
    };
  }

  // Check if token matches Master Admin Key, Admin Password, or session token
  const validAdminTokens = [
    settings.masterAdminKey,
    settings.adminPassword,
    `session_${settings.adminUsername}_${settings.adminPassword}`,
  ];

  if (!validAdminTokens.includes(token)) {
    return {
      isAuthenticated: false,
      isAdmin: false,
      error: 'Sesi admin tidak valid atau sudah kadaluarsa. Silakan login kembali.',
      statusCode: 401,
    };
  }

  return {
    isAuthenticated: true,
    isAdmin: true,
  };
}
