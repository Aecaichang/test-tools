import type { VercelRequest, VercelResponse } from '@vercel/node';
import { buildMockRequestContext, resolveMockDispatch } from '../src/features/mock-server/mock-server-runtime';

const normalizeQueryValue = (value: string | string[] | undefined) => {
  if (Array.isArray(value)) {
    return value[0] ?? '';
  }

  return value ?? '';
};

const buildMockRequestPath = (mockPath: string) => {
  const trimmed = mockPath.trim().replace(/^\/+/, '');
  if (!trimmed) {
    return '/shopeeApi';
  }

  return `/shopeeApi/${trimmed}`;
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

const buildHeaderObject = (headers: VercelRequest['headers']) =>
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

const createJsonResponse = (res: VercelResponse, status: number, payload: unknown) => {
  res.statusCode = status;
  res.setHeader('content-type', 'application/json; charset=utf-8');
  res.setHeader('cache-control', 'no-store');
  res.end(JSON.stringify(payload, null, 2));
};

const readRequestBody = (req: VercelRequest) => {
  if (req.method === 'GET' || req.method === 'HEAD') {
    return null;
  }

  return req.body ?? null;
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const requestUrl = buildMockRequestUrl(req);
    const requestContext = buildMockRequestContext(
      requestUrl,
      (req.method ?? 'GET').toUpperCase(),
      buildHeaderObject(req.headers),
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

    if (dispatch.delayMs > 0) {
      await new Promise((resolve) => setTimeout(resolve, dispatch.delayMs));
    }

    res.statusCode = dispatch.status;
    Object.entries(dispatch.headers).forEach(([key, value]) => {
      res.setHeader(key, value);
    });
    res.setHeader('cache-control', 'no-store');

    if (dispatch.status === 204 || requestContext.method === 'HEAD') {
      res.end();
      return;
    }

    if (typeof dispatch.body === 'string') {
      res.end(dispatch.body);
      return;
    }

    const contentType = String(dispatch.headers['content-type'] ?? dispatch.headers['Content-Type'] ?? '').toLowerCase();
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
