import { createClient } from '@supabase/supabase-js'
import { type IncomingMessage, type ServerResponse } from 'http'
import { loadEnv, defineConfig, type ViteDevServer } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { findMatchingMockRoutesByPath, resolveMockRoute } from './src/features/mock-server/mock-server-utils'

interface MockRouteRecord {
  id: string
  name: string
  enabled: boolean
  method: string
  path_pattern: string
  status: number
  delay_ms: number
  response_headers: Record<string, string>
  response_body: string
  notes: string
}

interface MockServerSnapshot {
  enabled: boolean
  routes: Array<{
    id: string
    name: string
    enabled: boolean
    method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'ANY'
    pathPattern: string
    status: number
    delayMs: number
    responseHeaders: Record<string, string>
    responseBody: string
    notes: string
  }>
}

const MOCK_ROUTES_TABLE = 'mock_routes'
const MOCK_SERVER_SETTINGS_TABLE = 'mock_server_settings'

const getRequestUrl = (req: IncomingMessage) => {
  const host = req.headers.host ?? 'localhost:5173'
  return new URL(req.url ?? '/', `http://${host}`).toString()
}

const readRequestBody = async (req: IncomingMessage) => {
  const chunks: Buffer[] = []

  for await (const chunk of req) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk)
  }

  const raw = Buffer.concat(chunks).toString('utf8')
  if (!raw) return null

  const contentType = String(req.headers['content-type'] ?? '').toLowerCase()
  if (contentType.includes('application/json')) {
    try {
      return JSON.parse(raw)
    } catch {
      return raw
    }
  }

  return raw
}

const toMockRoute = (record: MockRouteRecord) => ({
  id: record.id,
  name: record.name,
  enabled: record.enabled,
  method: (record.method || 'GET') as MockServerSnapshot['routes'][number]['method'],
  pathPattern: record.path_pattern,
  status: record.status,
  delayMs: record.delay_ms,
  responseHeaders: record.response_headers ?? { 'content-type': 'application/json' },
  responseBody: record.response_body ?? '{}',
  notes: record.notes ?? '',
})

const createMockServerMiddleware = (supabaseUrl: string, supabaseAnonKey: string) => {
  const supabase = createClient(supabaseUrl, supabaseAnonKey)
  let snapshot: MockServerSnapshot = { enabled: false, routes: [] }
  let lastLoadedAt = 0

  const loadSnapshot = async () => {
    const now = Date.now()
    if (now - lastLoadedAt < 1500 && snapshot.routes.length > 0) {
      return snapshot
    }

    const [settingsResult, routesResult] = await Promise.all([
      supabase.from(MOCK_SERVER_SETTINGS_TABLE).select('enabled').eq('id', 1).maybeSingle(),
      supabase.from(MOCK_ROUTES_TABLE).select('*').order('created_at', { ascending: true }),
    ])

    if (settingsResult.error) {
      throw settingsResult.error
    }

    if (routesResult.error) {
      throw routesResult.error
    }

    snapshot = {
      enabled: Boolean(settingsResult.data?.enabled),
      routes: (routesResult.data ?? []).map((item) => toMockRoute(item as MockRouteRecord)),
    }
    lastLoadedAt = now

    return snapshot
  }

  return async (req: IncomingMessage, res: ServerResponse, next: () => void) => {
    if (!req.url) {
      next()
      return
    }

    try {
      const currentSnapshot = await loadSnapshot()
      if (!currentSnapshot.enabled) {
        next()
        return
      }

      const requestUrl = getRequestUrl(req)
      const requestBody = await readRequestBody(req)
      const requestContext = {
        method: (req.method ?? 'GET').toUpperCase(),
        url: requestUrl,
        path: new URL(requestUrl).pathname,
        query: Object.fromEntries(new URL(requestUrl).searchParams.entries()),
        headers: Object.entries(req.headers).reduce<Record<string, string>>((acc, [key, value]) => {
          acc[key.toLowerCase()] = Array.isArray(value) ? value.join(',') : String(value ?? '')
          return acc
        }, {}),
        body: requestBody,
      }

      const pathMatchedRoutes = findMatchingMockRoutesByPath(currentSnapshot.routes, requestContext.path)
      if (pathMatchedRoutes.length > 0) {
        const method = requestContext.method
        const methodMatchedRoute = pathMatchedRoutes.find((route) => route.method.toUpperCase() === 'ANY' || route.method.toUpperCase() === method)

        if (!methodMatchedRoute) {
          res.statusCode = 405
          res.setHeader('content-type', 'application/json; charset=utf-8')
          res.end(JSON.stringify({
            error: 'Method Not Allowed',
            message: `Route ${pathMatchedRoutes[0].pathPattern} exists but does not accept ${method}`,
            requestMethod: method,
            routeMethod: pathMatchedRoutes.map((route) => route.method),
            requestPath: requestContext.path,
          }, null, 2))
          return
        }
      }

      const match = resolveMockRoute(currentSnapshot.routes, requestContext)
      if (!match) {
        next()
        return
      }

      if (match.delayMs > 0) {
        await new Promise((resolve) => setTimeout(resolve, match.delayMs))
      }

      res.statusCode = match.status
      Object.entries(match.headers).forEach(([key, value]) => {
        res.setHeader(key, value)
      })

      if (match.status === 204 || requestContext.method === 'HEAD') {
        res.end()
        return
      }

      if (typeof match.data === 'string') {
        res.end(match.data)
        return
      }

      const contentType = String(match.headers['content-type'] ?? match.headers['Content-Type'] ?? '').toLowerCase()
      if (contentType.includes('application/json')) {
        res.end(JSON.stringify(match.data))
        return
      }

      if (match.data === null || match.data === undefined) {
        res.end('')
        return
      }

      res.end(String(match.data))
    } catch (error) {
      console.error('[Mock Server] Failed to resolve route:', error)
      next()
    }
  }
}

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const supabaseUrl = env.VITE_SUPABASE_URL
  const supabaseAnonKey = env.VITE_SUPABASE_ANON_KEY

  const mockServerPlugin = supabaseUrl && supabaseAnonKey
    ? {
        name: 'mock-server-middleware',
        configureServer(server: ViteDevServer) {
          server.middlewares.use(createMockServerMiddleware(supabaseUrl, supabaseAnonKey))
        },
      }
    : undefined

  return {
    plugins: [react(), ...(mockServerPlugin ? [mockServerPlugin] : [])],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    server: {
      proxy: {
        // Universal Dynamic Proxy: Extracts target from 'x-target-origin' header
        '/proxy': {
          target: 'http://localhost:5173', // Placeholder, overridden by router
          changeOrigin: true,
          secure: false,
          rewrite: (path: string) => path.replace(/^\/proxy/, ''),
          router: (req: { headers: Record<string, string | string[] | undefined> }) => {
            const targetOrigin = req.headers['x-target-origin']
            if (typeof targetOrigin === 'string' && targetOrigin.startsWith('http')) {
              console.log(`[Proxy] Routing to: ${targetOrigin}`)
              return targetOrigin
            }
            console.warn('[Proxy] Missing or invalid x-target-origin header')
            return undefined
          },
        },
      },
    },
  }
})
