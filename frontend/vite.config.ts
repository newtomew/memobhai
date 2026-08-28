import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  envDir: '../',
  plugins: [react()],
  resolve: {
    // Prefer TypeScript sources over stale compiled .js files in src/
    extensions: ['.tsx', '.ts', '.jsx', '.js', '.json'],
  },
  server: {
    port: 20262,
    strictPort: true,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
})
