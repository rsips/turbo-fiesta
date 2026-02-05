import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'

// Check if TLS certificates exist
const certPath = './certs/server.crt'
const keyPath = './certs/server.key'
const tlsEnabled = process.env.VITE_TLS_ENABLED === 'true'
const hasCerts = fs.existsSync(certPath) && fs.existsSync(keyPath)

// Determine backend protocol
const backendProtocol = process.env.VITE_BACKEND_TLS === 'true' ? 'https' : 'http'
const backendPort = process.env.VITE_BACKEND_PORT || '8080'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    // Enable HTTPS if requested and certificates are available
    ...(tlsEnabled && hasCerts ? {
      https: {
        key: fs.readFileSync(keyPath),
        cert: fs.readFileSync(certPath),
      }
    } : {}),
    proxy: {
      '/api': {
        target: `${backendProtocol}://localhost:${backendPort}`,
        changeOrigin: true,
        // If backend uses self-signed cert, disable SSL verification in dev
        secure: process.env.NODE_ENV === 'production',
      },
      // WebSocket proxy
      '/ws': {
        target: `${backendProtocol === 'https' ? 'wss' : 'ws'}://localhost:${backendPort}`,
        ws: true,
        changeOrigin: true,
        secure: process.env.NODE_ENV === 'production',
      },
    }
  }
})
