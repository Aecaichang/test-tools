import { buildRequestContext, findMatchingMockRoutesByPath, resolveMockRoute } from './mock-server-utils';
import { type MockHttpMethod, type MockRequestContext, type MockRouteDefinition } from './types';

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
  disabledReason?: 'missing-env';
}

export type MockDispatchResult =
  | {
      kind: 'disabled';
      disabledReason?: 'missing-env';
    }
  | {
      kind: 'not-found';
    }
  | {
      kind: 'method-not-allowed';
      requestMethod: string;
      requestPath: string;
      acceptedMethods: MockHttpMethod[];
    }
  | {
      kind: 'mock';
      route: MockRouteDefinition;
      status: number;
      headers: Record<string, string>;
      body: unknown;
      delayMs: number;
    };

const MOCK_ROUTES_TABLE = 'mock_routes';
const MOCK_SERVER_SETTINGS_TABLE = 'mock_server_settings';
const CACHE_TTL_MS = 1500;

let cachedSnapshot: { loadedAt: number; snapshot: MockServerSnapshot } | null = null;

const getRuntimeEnv = () => {
  const supabaseUrl = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY ?? process.env.VITE_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return null;
  }

  return { supabaseUrl, supabaseAnonKey };
};

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

export const loadMockServerSnapshot = async (): Promise<MockServerSnapshot> => {
  const env = getRuntimeEnv();
  if (!env) {
    return { enabled: false, routes: [], disabledReason: 'missing-env' };
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

const normalizeAcceptedMethods = (routes: MockRouteDefinition[]) =>
  Array.from(
    new Set(
      routes.map((route) => route.method.toUpperCase() as MockHttpMethod),
    ),
  );

export const resolveMockDispatch = async (
  request: MockRequestContext,
): Promise<MockDispatchResult> => {
  const snapshot = await loadMockServerSnapshot();
  if (!snapshot.enabled) {
    return { kind: 'disabled', disabledReason: snapshot.disabledReason };
  }

  const matchingRoutes = findMatchingMockRoutesByPath(snapshot.routes, request.path);
  if (matchingRoutes.length > 0) {
    const method = request.method.toUpperCase();
    const route = matchingRoutes.find((item) => item.method === 'ANY' || item.method === method);
    if (!route) {
      return {
        kind: 'method-not-allowed',
        requestMethod: method,
        requestPath: request.path,
        acceptedMethods: normalizeAcceptedMethods(matchingRoutes),
      };
    }
  }

  const match = resolveMockRoute(snapshot.routes, request);
  if (!match) {
    return { kind: 'not-found' };
  }

  return {
    kind: 'mock',
    route: match.route,
    status: match.status,
    headers: match.headers,
    body: match.data,
    delayMs: match.delayMs,
  };
};

export const buildMockRequestContext = (
  url: string,
  method: string,
  headers: Record<string, string>,
  body: unknown,
) => buildRequestContext(url, method, headers, body);
