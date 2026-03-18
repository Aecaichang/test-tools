import type { VercelRequest, VercelResponse } from '@vercel/node';

type MockHttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'ANY';

interface MockRouteDefinition {
  id: string;
  name: string;
  enabled: boolean;
  method: MockHttpMethod;
  pathPattern: string;
  status: number;
  delayMs: number;
  responseHeaders: Record<string, string>;
  responseBody: string;
  notes: string;
}

interface MockRequestContext {
  method: string;
  url: string;
  path: string;
  query: Record<string, string>;
  headers: Record<string, string>;
  body: unknown;
}

interface MockDispatchResult {
  kind: 'disabled' | 'not-found' | 'method-not-allowed' | 'mock';
  requestMethod?: string;
  requestPath?: string;
  acceptedMethods?: MockHttpMethod[];
  route?: MockRouteDefinition;
  status?: number;
  headers?: Record<string, string>;
  body?: unknown;
  delayMs?: number;
}

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

const MOCK_ROUTES_TABLE = 'mock_routes';
const MOCK_SERVER_SETTINGS_TABLE = 'mock_server_settings';
const CACHE_TTL_MS = 1500;

let cachedSnapshot: { loadedAt: number; snapshot: MockServerSnapshot } | null = null;

const normalizeMethod = (method: string): MockHttpMethod =>
  method === 'GET' || method === 'POST' || method === 'PUT' || method === 'PATCH' || method === 'DELETE' || method === 'ANY'
    ? method
    : 'GET';

const normalizePath = (value: string) => {
  const trimmed = value.trim();
  if (!trimmed || trimmed === '/') return '/';
  return trimmed.replace(/\/+$/, '');
};

const escapeRegex = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const matchesPattern = (pattern: string, pathname: string) => {
  const normalizedPattern = normalizePath(pattern).replace(/^\*$/, '.*');
  const normalizedPath = normalizePath(pathname);
  const regexSource = `^${escapeRegex(normalizedPattern).replace(/\\\*/g, '.*')}$`;
  return new RegExp(regexSource).test(normalizedPath);
};

const coerceJson = (value: string) => {
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
};

const serializeBody = (body: unknown) => {
  if (typeof body === 'string') return body;
  if (body === null || body === undefined) return '';

  try {
    return JSON.stringify(body);
  } catch {
    return String(body);
  }
};

const randomId = () => `mock_${Math.random().toString(36).slice(2, 10)}`;

const getPathSegment = (path: string, index: number) => {
  const segments = normalizePath(path).split('/').filter(Boolean);
  return segments[index] ?? '';
};

const interpolateString = (input: string, context: MockRequestContext) =>
  input.replace(/\{\{\s*([^}]+?)\s*\}\}/g, (_, tokenRaw: string) => {
    const token = tokenRaw.trim();

    if (token === 'method') return context.method;
    if (token === 'url') return context.url;
    if (token === 'path') return context.path;
    if (token === 'body') return serializeBody(context.body);
    if (token === 'timestamp') return String(Date.now());
    if (token === 'isoTimestamp') return new Date().toISOString();
    if (token === 'randomId') return randomId();
    if (token === 'pathSegment1') return getPathSegment(context.path, 1);
    if (token === 'pathSegment2') return getPathSegment(context.path, 2);

    if (token.startsWith('query.')) {
      const queryKey = token.slice('query.'.length);
      return context.query[queryKey] ?? '';
    }

    if (token.startsWith('header.')) {
      const headerKey = token.slice('header.'.length).toLowerCase();
      return context.headers[headerKey] ?? '';
    }

    return '';
  });

const deepInterpolate = (value: unknown, context: MockRequestContext): unknown => {
  if (typeof value === 'string') {
    return interpolateString(value, context);
  }

  if (Array.isArray(value)) {
    return value.map((item) => deepInterpolate(item, context));
  }

  if (value && typeof value === 'object') {
    return Object.entries(value as Record<string, unknown>).reduce<Record<string, unknown>>((acc, [key, nestedValue]) => {
      acc[key] = deepInterpolate(nestedValue, context);
      return acc;
    }, {});
  }

  return value;
};

const buildRequestContext = (
  url: string,
  method: string,
  headers: Record<string, string>,
  body: unknown,
): MockRequestContext => {
  const parsedUrl = new URL(url);
  const query = Object.fromEntries(parsedUrl.searchParams.entries());
  const normalizedHeaders = Object.entries(headers).reduce<Record<string, string>>((acc, [key, value]) => {
    acc[key.toLowerCase()] = value;
    return acc;
  }, {});

  return {
    method: method.toUpperCase(),
    url,
    path: parsedUrl.pathname,
    query,
    headers: normalizedHeaders,
    body,
  };
};

const findMatchingMockRoutesByPath = (routes: MockRouteDefinition[], pathname: string) =>
  routes.filter((item) => item.enabled && matchesPattern(item.pathPattern, pathname));

const resolveMockRoute = (
  routes: MockRouteDefinition[],
  request: MockRequestContext,
): MockDispatchResult | null => {
  const pathname = request.path || new URL(request.url).pathname;
  const method = request.method.toUpperCase();

  const route = routes.find((item) => {
    if (!item.enabled) return false;
    if (item.method !== 'ANY' && item.method !== method) return false;
    return matchesPattern(item.pathPattern, pathname);
  });

  if (!route) return null;

  const parsedBody = coerceJson(route.responseBody);
  const interpolatedBody = deepInterpolate(parsedBody, {
    ...request,
    method,
    path: pathname,
  });

  const headers = Object.entries(route.responseHeaders).reduce<Record<string, string>>((acc, [key, value]) => {
    acc[key.toLowerCase()] = interpolateString(String(value), {
      ...request,
      method,
      path: pathname,
    });
    return acc;
  }, {});

  return {
    kind: 'mock',
    route,
    body: interpolatedBody,
    headers,
    status: route.status,
    delayMs: Math.max(0, route.delayMs),
  };
};

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

const loadMockServerSnapshot = async (): Promise<MockServerSnapshot> => {
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

const normalizeAcceptedMethods = (routes: MockRouteDefinition[]) =>
  Array.from(new Set(routes.map((route) => route.method)));

const resolveMockDispatch = async (request: MockRequestContext): Promise<MockDispatchResult> => {
  const snapshot = await loadMockServerSnapshot();
  if (!snapshot.enabled) {
    return { kind: 'disabled' };
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

  return match;
};

const normalizeHeaderObject = (headers: VercelRequest['headers']) =>
  Object.entries(headers).reduce<Record<string, string>>((acc, [key, value]) => {
    if (Array.isArray(value)) {
      acc[key.toLowerCase()] = value.join(', ');
      return acc;
    }

    if (value !== undefined) {
      acc[key.toLowerCase()] = String(value);
    }

    return acc;
  }, {});

const normalizeQueryValue = (value: string | string[] | undefined) => {
  if (Array.isArray(value)) {
    return value[0] ?? '';
  }

  return value ?? '';
};

const buildMockRequestPath = (mockPath: string) => {
  const trimmed = mockPath.trim().replace(/^\/+/, '');
  if (!trimmed) {
    return '/';
  }

  return `/${trimmed}`;
};

const buildMockRequestUrl = (req: VercelRequest) => {
  const protocol = normalizeQueryValue(req.headers['x-forwarded-proto'] as string | string[] | undefined) || 'https';
  const host = normalizeQueryValue(req.headers.host as string | string[] | undefined) || 'localhost';
  const requestUrl = new URL(`${protocol}://${host}`);
  requestUrl.pathname = buildMockRequestPath(normalizeQueryValue(req.query.mock_path as string | string[] | undefined));

  Object.entries(req.query).forEach(([key, value]) => {
    if (key === 'mock_path') return;

    if (Array.isArray(value)) {
      value.forEach((item) => requestUrl.searchParams.append(key, String(item)));
      return;
    }

    if (value !== undefined) {
      requestUrl.searchParams.append(key, String(value));
    }
  });

  return requestUrl.toString();
};

const readRequestBody = (req: VercelRequest) => {
  if (req.method === 'GET' || req.method === 'HEAD') {
    return null;
  }

  return req.body ?? null;
};

const createJsonResponse = (res: VercelResponse, status: number, payload: unknown) => {
  res.statusCode = status;
  res.setHeader('content-type', 'application/json; charset=utf-8');
  res.setHeader('cache-control', 'no-store');
  res.end(JSON.stringify(payload, null, 2));
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const requestUrl = buildMockRequestUrl(req);
    const requestContext = buildRequestContext(
      requestUrl,
      (req.method ?? 'GET').toUpperCase(),
      normalizeHeaderObject(req.headers),
      readRequestBody(req),
    );

    const dispatch = await resolveMockDispatch(requestContext);

    if (dispatch.kind === 'disabled') {
      createJsonResponse(res, 503, {
        error: 'Mock Server Disabled',
        message: 'Mock Server is currently disabled in mock_server_settings.',
        requestPath: requestContext.path,
      });
      return;
    }

    if (dispatch.kind === 'not-found') {
      createJsonResponse(res, 404, {
        error: 'Not Found',
        message: `No mock route matched ${requestContext.path}`,
        requestMethod: requestContext.method,
        requestPath: requestContext.path,
      });
      return;
    }

    if (dispatch.kind === 'method-not-allowed') {
      createJsonResponse(res, 405, {
        error: 'Method Not Allowed',
        message: `Mock route exists for ${dispatch.requestPath} but does not accept ${dispatch.requestMethod}`,
        requestMethod: dispatch.requestMethod,
        requestPath: dispatch.requestPath,
        acceptedMethods: dispatch.acceptedMethods,
      });
      return;
    }

    if (dispatch.delayMs && dispatch.delayMs > 0) {
      await new Promise((resolve) => setTimeout(resolve, dispatch.delayMs));
    }

    res.statusCode = dispatch.status ?? 200;
    Object.entries(dispatch.headers ?? {}).forEach(([key, value]) => {
      res.setHeader(key, value);
    });
    res.setHeader('cache-control', 'no-store');

    if ((dispatch.status ?? 200) === 204 || requestContext.method === 'HEAD') {
      res.end();
      return;
    }

    if (typeof dispatch.body === 'string') {
      res.end(dispatch.body);
      return;
    }

    const contentType = String(dispatch.headers?.['content-type'] ?? dispatch.headers?.['Content-Type'] ?? '').toLowerCase();
    if (contentType.includes('application/json')) {
      res.end(JSON.stringify(dispatch.body, null, 2));
      return;
    }

    if (dispatch.body === null || dispatch.body === undefined) {
      res.end('');
      return;
    }

    res.end(String(dispatch.body));
  } catch (error) {
    console.error('[Mock API Route] Failed to resolve route:', error);
    createJsonResponse(res, 500, {
      error: 'Mock Route Error',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
