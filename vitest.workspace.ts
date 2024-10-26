import { join } from 'node:path'
import { defineConfig, defineWorkspace, mergeConfig } from 'vitest/config'
import viteConfig from './vite.config'

const alias = {
  'hook-di': join(__dirname, `src/index.ts`),
  'hook-di/vue': join(__dirname, `src/vue.ts`),
}

export default defineWorkspace([
  defineConfig((configEnv) => {
    return mergeConfig(viteConfig(configEnv), {
      test: {
        include: ['**/__tests__/*.browser.test.{ts,js}'],
        name: 'browser',
        environment: 'jsdom',
      },
      resolve: {
        alias: {
          ...alias,
        },
      },
    })
  }),
  defineConfig((configEnv) => {
    return mergeConfig(
      viteConfig({
        ...configEnv,
        isSsrBuild: true,
      }),
      defineConfig({
        test: {
          include: ['**/__tests__/*.node.test.{ts,js}'],
          name: 'node',
          environment: 'node',
        },
        resolve: {
          alias: {
            ...alias,
          },
        },
      }),
    )
  }),
])
