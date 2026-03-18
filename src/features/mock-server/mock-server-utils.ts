import { type MockRequestContext, type MockResolution, type MockRouteDefinition } from './types';

const normalizePath = (value: string) => {
  const trimmed = value.trim();
  if (!trimmed) return '/';
  if (trimmed === '/') return '/';
  return trimmed.replace(/\/+$/, '');
};

const escapeRegex = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const matchesPattern = (pattern: string, pathname: string) => {
  const normalizedPattern = normalizePath(pattern).replace(/^\*$/, '.*');
  const normalizedPath = normalizePath(pathname);
  const regexSource = `^${escapeRegex(normalizedPattern).replace(/\\\*/g, '.*')}$`;
  return new RegExp(regexSource).test(normalizedPath);
};

export const matchesMockRoutePath = (pathPattern: string, pathname: string) =>
  matchesPattern(pathPattern, pathname);

export const findMatchingMockRouteByPath = (
  routes: MockRouteDefinition[],
  pathname: string,
) => routes.find((item) => item.enabled && matchesPattern(item.pathPattern, pathname)) ?? null;

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

const normalizeMethod = (method: string) => method.toUpperCase();

export const resolveMockRoute = (
  routes: MockRouteDefinition[],
  request: MockRequestContext,
): MockResolution | null => {
  const pathname = request.path || new URL(request.url).pathname;
  const method = normalizeMethod(request.method);

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
    route,
    data: interpolatedBody,
    headers,
    status: route.status,
    delayMs: Math.max(0, route.delayMs),
  };
};

export const buildRequestContext = (
  url: string,
  method: string,
  headers: Record<string, string>,
  body: unknown,
): MockRequestContext => {
  const parsedUrl = new URL(url, getDefaultOrigin());
  const query = Object.fromEntries(parsedUrl.searchParams.entries());
  const normalizedHeaders = Object.entries(headers).reduce<Record<string, string>>((acc, [key, value]) => {
    acc[key.toLowerCase()] = value;
    return acc;
  }, {});

  return {
    method: normalizeMethod(method),
    url,
    path: parsedUrl.pathname,
    query,
    headers: normalizedHeaders,
    body,
  };
};

export const getMockServerBaseUrl = () => (
  getDefaultOrigin()
);

export const buildMockRequestUrl = (pathPattern: string) => {
  const normalizedPath = pathPattern.startsWith('/') ? pathPattern : `/${pathPattern}`;
  return new URL(normalizedPath, getMockServerBaseUrl()).toString();
};

const getDefaultOrigin = () => {
  const globalWindow = globalThis as typeof globalThis & {
    window?: { location?: { origin?: string } }
  };

  return globalWindow.window?.location?.origin ?? 'http://localhost:5173';
};
