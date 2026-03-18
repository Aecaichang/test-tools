import { parseCurl } from '@/features/loop-api/utils/curl-parser';
import { generateMockRouteId } from './mock-server-storage';
import { type MockHttpMethod, type MockRouteDefinition, type MockRouteDraft } from './types';

const isMockHttpMethod = (value: string): value is MockHttpMethod =>
  value === 'GET' || value === 'POST' || value === 'PUT' || value === 'PATCH' || value === 'DELETE' || value === 'ANY';

const methodToStatus = (method: MockHttpMethod): number => {
  if (method === 'POST') return 201;
  if (method === 'DELETE') return 204;
  return 200;
};

const methodToTitle = (method: MockHttpMethod) => {
  switch (method) {
    case 'GET':
      return 'List';
    case 'POST':
      return 'Create';
    case 'PUT':
      return 'Replace';
    case 'PATCH':
      return 'Patch';
    case 'DELETE':
      return 'Delete';
    default:
      return 'Mock';
  }
};

const toRoutePathPattern = (url: string): string => {
  const trimmed = url.trim();

  if (!trimmed) {
    return '/api/mock';
  }

  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return new URL(trimmed).pathname;
  }

  const templatedPathMatch = trimmed.match(/^\$\{[^}]+\}(\/[^?#]*)/);
  if (templatedPathMatch?.[1]) {
    return templatedPathMatch[1];
  }

  if (trimmed.startsWith('/')) {
    return trimmed.split('?')[0];
  }

  const pathMatch = trimmed.match(/(\/[^?#]*)/);
  if (pathMatch?.[1]) {
    return pathMatch[1];
  }

  return '/api/mock';
};

const toPrettyJson = (value: unknown) => JSON.stringify(value, null, 2);

const buildResponseBody = (url: URL, method: MockHttpMethod, requestBody: unknown, headers: Record<string, string>) =>
  toPrettyJson({
    success: true,
    source: 'mock-server',
    message: `${methodToTitle(method)} response for ${url.pathname}`,
    request: {
      method,
      url: url.toString(),
      path: url.pathname,
      query: Object.fromEntries(url.searchParams.entries()),
      headers,
      body: requestBody,
    },
    meta: {
      generatedAt: '{{isoTimestamp}}',
    },
  });

export const createMockRouteFromCurl = (curlCommand: string): MockRouteDraft => {
  const parsed = parseCurl(curlCommand);
  if (!parsed.url) {
    throw new Error('Could not find URL in CURL command');
  }

  const routePathPattern = toRoutePathPattern(parsed.url);
  const absoluteUrl = parsed.url.startsWith('http://') || parsed.url.startsWith('https://')
    ? new URL(parsed.url)
    : new URL(routePathPattern, 'http://mock.local');
  const method = isMockHttpMethod(parsed.method) ? parsed.method : 'GET';
  const headers = Object.entries(parsed.headers).reduce<Record<string, string>>((acc, [key, value]) => {
    acc[key.toLowerCase()] = value;
    return acc;
  }, {});

  const routeName = `${methodToTitle(method)} ${routePathPattern}`;
  const status = methodToStatus(method);
  const responseHeaders = {
    'content-type': headers['content-type'] || 'application/json',
    'x-mock-source': 'cURL',
  };

  return {
    id: generateMockRouteId(),
    name: routeName,
    enabled: true,
    method,
    pathPattern: routePathPattern,
    status,
    delayMs: 0,
    responseHeadersText: toPrettyJson(responseHeaders),
    responseBody: buildResponseBody(absoluteUrl, method, parsed.data ?? null, headers),
    notes: `Generated from cURL ${parsed.url}`,
  } satisfies MockRouteDraft;
};

export const createMockRouteDefinitionPreview = (curlCommand: string): MockRouteDefinition => {
  const draft = createMockRouteFromCurl(curlCommand);
  return {
    id: draft.id,
    name: draft.name,
    enabled: draft.enabled,
    method: draft.method,
    pathPattern: draft.pathPattern,
    status: draft.status,
    delayMs: draft.delayMs,
    responseHeaders: JSON.parse(draft.responseHeadersText) as Record<string, string>,
    responseBody: draft.responseBody,
    notes: draft.notes,
  };
};
