import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
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
        // @ts-expect-error - router is supported by http-proxy-middleware but Vite types are strict
        router: (req: { headers: Record<string, string | string[] | undefined> }) => {
          const targetOrigin = req.headers['x-target-origin'];
          if (typeof targetOrigin === 'string' && targetOrigin.startsWith('http')) {
            console.log(`[Proxy] Routing to: ${targetOrigin}`);
            return targetOrigin;
          }
          console.warn('[Proxy] Missing or invalid x-target-origin header');
          return undefined; 
        },
      }
    }
  }
})
