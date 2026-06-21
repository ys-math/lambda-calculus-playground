/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
// `base` must match the GitHub repo name so asset URLs resolve under
// https://<user>.github.io/lambda-calculus-playground/
export default defineConfig({
  base: '/lambda-calculus-playground/',
  plugins: [react()],
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
})
