import { type IncomingMessage, type ServerResponse } from 'http'
import { loadEnv, defineConfig, type ViteDevServer } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { buildMockRequestContext, resolveMockDispatch } from './src/features/mock-server/mock-server-runtime'

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

const createMockServerMiddleware = () => {
  return async (req: IncomingMessage, res: ServerResponse, next: () => void) => {
    if (!req.url) {
      next()
      return
    }

    try {
      const requestUrl = getRequestUrl(req)
      const requestBody = await readRequestBody(req)
      const requestContext = buildMockRequestContext(
        requestUrl,
        (req.method ?? 'GET').toUpperCase(),
        Object.entries(req.headers).reduce<Record<string, string>>((acc, [key, value]) => {
          acc[key.toLowerCase()] = Array.isArray(value) ? value.join(',') : String(value ?? '')
          return acc
        }, {}),
        requestBody,
      )

      const dispatch = await resolveMockDispatch(requestContext)
      if (dispatch.kind === 'disabled') {
        if (requestContext.path.startsWith('/shopeeApi/')) {
          res.statusCode = 503
          res.setHeader('content-type', 'application/json; charset=utf-8')
          res.end(JSON.stringify({
            error: 'Mock Server Disabled',
            message: 'Mock Server is currently disabled in mock_server_settings.',
            requestPath: requestContext.path,
          }, null, 2))
          return
        }

        next()
        return
      }

      if (dispatch.kind === 'not-found') {
        if (requestContext.path.startsWith('/shopeeApi/')) {
          res.statusCode = 404
          res.setHeader('content-type', 'application/json; charset=utf-8')
          res.end(JSON.stringify({
            error: 'Not Found',
            message: `No mock route matched ${requestContext.path}`,
            requestMethod: requestContext.method,
            requestPath: requestContext.path,
          }, null, 2))
          return
        }

        next()
        return
      }

      if (dispatch.kind === 'method-not-allowed') {
        res.statusCode = 405
        res.setHeader('content-type', 'application/json; charset=utf-8')
        res.end(JSON.stringify({
          error: 'Method Not Allowed',
          message: `Mock route exists for ${dispatch.requestPath} but does not accept ${dispatch.requestMethod}`,
          requestMethod: dispatch.requestMethod,
          requestPath: dispatch.requestPath,
          acceptedMethods: dispatch.acceptedMethods,
        }, null, 2))
        return
      }

      if (dispatch.delayMs > 0) {
        await new Promise((resolve) => setTimeout(resolve, dispatch.delayMs))
      }

      res.statusCode = dispatch.status
      Object.entries(dispatch.headers).forEach(([key, value]) => {
        res.setHeader(key, value)
      })

      if (dispatch.status === 204 || requestContext.method === 'HEAD') {
        res.end()
        return
      }

      if (typeof dispatch.body === 'string') {
        res.end(dispatch.body)
        return
      }

      const contentType = String(dispatch.headers['content-type'] ?? dispatch.headers['Content-Type'] ?? '').toLowerCase()
      if (contentType.includes('application/json')) {
        res.end(JSON.stringify(dispatch.body))
        return
      }

      if (dispatch.body === null || dispatch.body === undefined) {
        res.end('')
        return
      }

      res.end(String(dispatch.body))
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
          server.middlewares.use(createMockServerMiddleware())
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
