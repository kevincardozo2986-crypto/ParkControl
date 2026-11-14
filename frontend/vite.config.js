import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'

// Cabeceras de seguridad (hallazgos DAST: CSP, anti-clickjacking, nosniff)
const cabecerasBase = {
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
}

const csp = (api, desarrollo) => [
  "default-src 'self'",
  // React Refresh (solo en desarrollo) inyecta un script en línea
  // wasm-unsafe-eval: el decodificador meshopt del modelo 3D usa WebAssembly
  `script-src 'self' 'wasm-unsafe-eval'${desarrollo ? " 'unsafe-inline'" : ''}`,
  // Vite inyecta <style> en desarrollo; el build usa archivos CSS externos
  // En producción solo se permite, por hash, el estilo en atributo que aplica model-viewer
  `style-src 'self'${desarrollo ? " 'unsafe-inline'" : " 'unsafe-hashes' 'sha256-PXtZZkJMMyc18o/DN1ZEFOJ2qEGq95IQbVaJFMOXOb0='"}`,
  // blob: las texturas del modelo 3D se cargan como blobs
  "img-src 'self' data: blob:",
  "font-src 'self' data:",
  `connect-src 'self' blob: data: ${api}${desarrollo ? ' ws:' : ''}`,
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
].join('; ')

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const api = loadEnv(mode, process.cwd(), '').VITE_API_URL || 'http://localhost:3000'
  return {
    plugins: [react()],
    server: { headers: { ...cabecerasBase, 'Content-Security-Policy': csp(api, true) } },
    preview: { headers: { ...cabecerasBase, 'Content-Security-Policy': csp(api, false) } },
  }
})
