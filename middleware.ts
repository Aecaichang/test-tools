import { buildRequestContext, findMatchingMockRoutesByPath, resolveMockRoute } from './src/features/mock-server/mock-server-utils';
import { type MockHttpMethod, type MockRouteDefinition } from './src/features/mock-server/types';

interface MockRouteRecord {
  id: string;
  name: string;
  enabled: boolean;
  method: string;
  path_pattern: string;
  status: number;
  delay_ms: number;
  response_headers: Record<string, string>;
  response_body: string;
  notes: string;
}

interface MockServerSnapshot {
  enabled: boolean;
  routes: MockRouteDefinition[];
}

interface CachedSnapshot {
  loadedAt: number;
  snapshot: MockServerSnapshot;
}

const MOCK_ROUTES_TABLE = 'mock_routes';
const MOCK_SERVER_SETTINGS_TABLE = 'mock_server_settings';
const CACHE_TTL_MS = 1500;

const staticLikePatterns = [
  /^\/assets\//,
  /^\/@/,
  /^\/favicon\.png$/,
  /^\/vite\.svg$/,
  /^\/.*\.[a-z0-9]+$/i,
];

let cachedSnapshot: CachedSnapshot | null = null;

const getRuntimeEnv = () => {
  const supabaseUrl = process.env.VITE_SUPABASE_URL ?? process.env.SUPABASE_URL;
  const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY ?? process.env.SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return null;
  }

  return { supabaseUrl, supabaseAnonKey };
};

const isStaticLikeRequest = (pathname: string) => staticLikePatterns.some((pattern) => pattern.test(pathname));

const toMockHttpMethod = (value: string): MockHttpMethod =>
  value === 'GET' || value === 'POST' || value === 'PUT' || value === 'PATCH' || value === 'DELETE' || value === 'ANY'
    ? value
    : 'GET';

const toMockRoute = (record: MockRouteRecord): MockRouteDefinition => ({
  id: record.id,
  name: record.name,
  enabled: record.enabled,
  method: toMockHttpMethod(record.method),
  pathPattern: record.path_pattern,
  status: record.status,
  delayMs: record.delay_ms,
  responseHeaders: record.response_headers ?? { 'content-type': 'application/json' },
  responseBody: record.response_body ?? '{}',
  notes: record.notes ?? '',
});

const fetchJson = async <T>(url: string, supabaseAnonKey: string): Promise<T> => {
  const response = await fetch(url, {
    headers: {
      apikey: supabaseAnonKey,
      authorization: `Bearer ${supabaseAnonKey}`,
      accept: 'application/json',
    },
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error(`Supabase request failed with status ${response.status}`);
  }

  return response.json() as Promise<T>;
};

const loadSnapshot = async (): Promise<MockServerSnapshot> => {
  const env = getRuntimeEnv();
  if (!env) {
    return { enabled: false, routes: [] };
  }

  const now = Date.now();
  if (cachedSnapshot && now - cachedSnapshot.loadedAt < CACHE_TTL_MS) {
    return cachedSnapshot.snapshot;
  }

  const settingsUrl = `${env.supabaseUrl}/rest/v1/${MOCK_SERVER_SETTINGS_TABLE}?select=enabled&id=eq.1`;
  const routesUrl = `${env.supabaseUrl}/rest/v1/${MOCK_ROUTES_TABLE}?select=*&order=created_at.asc`;

  const [settingsRows, routeRows] = await Promise.all([
    fetchJson<Array<{ enabled?: boolean }>>(settingsUrl, env.supabaseAnonKey),
    fetchJson<MockRouteRecord[]>(routesUrl, env.supabaseAnonKey),
  ]);

  const snapshot = {
    enabled: Boolean(settingsRows[0]?.enabled),
    routes: routeRows.map(toMockRoute),
  };

  cachedSnapshot = {
    loadedAt: now,
    snapshot,
  };

  return snapshot;
};

const readRequestBody = async (request: Request) => {
  if (request.method === 'GET' || request.method === 'HEAD') {
    return null;
  }

  const raw = await request.text();
  if (!raw) return null;

  const contentType = request.headers.get('content-type')?.toLowerCase() ?? '';
  if (contentType.includes('application/json')) {
    try {
      return JSON.parse(raw);
    } catch {
      return raw;
    }
  }

  return raw;
};

const buildHeaderObject = (request: Request) =>
  Object.fromEntries(
    Array.from(request.headers.entries()).map(([key, value]) => [key.toLowerCase(), value]),
  );

const createJsonResponse = (payload: unknown, status: number) =>
  new Response(JSON.stringify(payload, null, 2), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
    },
  });

export default async function middleware(request: Request) {
  const url = new URL(request.url);
  const pathname = url.pathname;

  if (isStaticLikeRequest(pathname)) {
    return;
  }

  try {
    const snapshot = await loadSnapshot();
    if (!snapshot.enabled) {
      return;
    }

    const matchingRoutes = findMatchingMockRoutesByPath(snapshot.routes, pathname);
    if (matchingRoutes.length === 0) {
      return;
    }

    const method = request.method.toUpperCase();
    const route = matchingRoutes.find((item) => item.method === 'ANY' || item.method === method);
    if (!route) {
      return createJsonResponse(
        {
          error: 'Method Not Allowed',
          message: `Mock route exists for ${pathname} but does not accept ${method}`,
          requestMethod: method,
          requestPath: pathname,
          acceptedMethods: matchingRoutes.map((item) => item.method),
        },
        405,
      );
    }

    const requestBody = await readRequestBody(request);
    const requestContext = buildRequestContext(request.url, method, buildHeaderObject(request), requestBody);
    const match = resolveMockRoute(snapshot.routes, requestContext);
    if (!match) {
      return;
    }

    if (match.delayMs > 0) {
      await new Promise((resolve) => setTimeout(resolve, match.delayMs));
    }

    const headers = new Headers();
    Object.entries(match.headers).forEach(([key, value]) => {
      headers.set(key, value);
    });

    if (!headers.has('content-type') && typeof match.data !== 'string') {
      headers.set('content-type', 'application/json; charset=utf-8');
    }

    headers.set('cache-control', 'no-store');

    if (match.status === 204 || method === 'HEAD') {
      return new Response(null, { status: match.status, headers });
    }

    if (typeof match.data === 'string') {
      return new Response(match.data, { status: match.status, headers });
    }

    return new Response(JSON.stringify(match.data, null, 2), { status: match.status, headers });
  } catch (error) {
    console.error('[Mock Middleware] Failed to resolve route:', error);
    return;
  }
}

export const config = {
  matcher: '/:path*',
};
