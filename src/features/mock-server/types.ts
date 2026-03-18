export type MockHttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'ANY';

export interface MockRouteDefinition {
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

export interface MockRequestContext {
  method: string;
  url: string;
  path: string;
  query: Record<string, string>;
  headers: Record<string, string>;
  body: unknown;
}

export interface MockResolution {
  route: MockRouteDefinition;
  data: unknown;
  headers: Record<string, string>;
  status: number;
  delayMs: number;
}

export interface MockServerState {
  enabled: boolean;
  routes: MockRouteDefinition[];
}

export interface MockServerBackupPayload {
  version: 1;
  exportedAt: string;
  enabled: boolean;
  routes: MockRouteDefinition[];
}

export interface MockRouteDraft {
  id: string;
  name: string;
  enabled: boolean;
  method: MockHttpMethod;
  pathPattern: string;
  status: number;
  delayMs: number;
  responseHeadersText: string;
  responseBody: string;
  notes: string;
}
