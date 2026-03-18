import { type MockRouteDefinition, type MockServerState } from './types';

const ROUTE_STORAGE_KEY = 'test_tools_mock_server_enabled_v1';

const createRouteId = () => `mock_${Math.random().toString(36).slice(2, 10)}`;

const createDefaultRoutes = (): MockRouteDefinition[] => [
  {
    id: createRouteId(),
    name: 'List Users',
    enabled: true,
    method: 'GET',
    pathPattern: '/api/users',
    status: 200,
    delayMs: 250,
    responseHeaders: {
      'content-type': 'application/json',
    },
    responseBody: JSON.stringify(
      {
        success: true,
        source: 'mock-server',
        message: 'Mock user list for {{path}}',
        items: [
          {
            id: '{{randomId}}',
            name: 'สมชาย ใจดี',
            email: 'somchai@example.com',
            role: 'tester',
          },
          {
            id: '{{randomId}}',
            name: 'กานดา มีทรัพย์',
            email: 'kanda@example.com',
            role: 'reviewer',
          },
        ],
        meta: {
          method: '{{method}}',
          timestamp: '{{isoTimestamp}}',
        },
      },
      null,
      2,
    ),
    notes: 'Baseline route for list endpoints.',
  },
  {
    id: createRouteId(),
    name: 'User Detail',
    enabled: true,
    method: 'GET',
    pathPattern: '/api/users/*',
    status: 200,
    delayMs: 180,
    responseHeaders: {
      'content-type': 'application/json',
    },
    responseBody: JSON.stringify(
      {
        success: true,
        source: 'mock-server',
        data: {
          id: '{{pathSegment1}}',
          name: 'Mock User {{pathSegment1}}',
          updatedAt: '{{isoTimestamp}}',
        },
      },
      null,
      2,
    ),
    notes: 'Wildcard route for detail endpoints.',
  },
  {
    id: createRouteId(),
    name: 'Create Order',
    enabled: true,
    method: 'POST',
    pathPattern: '/api/orders',
    status: 201,
    delayMs: 400,
    responseHeaders: {
      'content-type': 'application/json',
    },
    responseBody: JSON.stringify(
      {
        success: true,
        source: 'mock-server',
        message: 'Order accepted',
        orderId: '{{randomId}}',
        received: '{{body}}',
      },
      null,
      2,
    ),
    notes: 'Simulates a create endpoint with echoed body.',
  },
];

const createDefaultState = (): MockServerState => ({
  enabled: false,
  routes: createDefaultRoutes(),
});

const isBrowser = typeof window !== 'undefined';

export const generateMockRouteId = () => createRouteId();

export const getMockServerEnabledStorageKey = () => ROUTE_STORAGE_KEY;

export const loadMockServerEnabled = (): boolean => {
  if (!isBrowser) return false;

  try {
    return window.localStorage.getItem(ROUTE_STORAGE_KEY) === 'true';
  } catch {
    return false;
  }
};

export const saveMockServerEnabled = (enabled: boolean) => {
  if (!isBrowser) return;
  window.localStorage.setItem(ROUTE_STORAGE_KEY, String(enabled));
};

export const createDefaultMockServerState = createDefaultState;
