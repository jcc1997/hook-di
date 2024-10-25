import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environmentMatchGlobs: [
      ['**/*.test.ts', 'jsdom'],
      ['**/*.node.test.ts', 'node'],
      ['**/*.edge.test.ts', 'edge-runtime'],
    ],
  },
})
