import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const projectRoot = path.dirname(fileURLToPath(import.meta.url))
const srcDir = path.resolve(projectRoot, 'src')

// https://vite.dev/config/
export default defineConfig({
  root: projectRoot,
  plugins: [
    tailwindcss(),
    react(),
  ],
  resolve: {
    tsconfigPaths: true,
    alias: [{ find: '@', replacement: srcDir }],
  },
  build: {
    rolldownOptions: {
      resolve: {
        alias: {
          '@': srcDir,
        },
      },
    },
  },
})
