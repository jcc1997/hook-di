import { basename, join } from 'node:path'
import { defineConfig } from 'vite'
import viteDts from 'vite-plugin-dts'
import { devDependencies } from './package.json'

export default defineConfig(({ isSsrBuild }) => {
  console.log(isSsrBuild)
  return {
    resolve: {
      alias: {
        '#interfaces': join(__dirname, `src/${isSsrBuild ? 'server' : 'default'}.ts`),
      },
    },
    build: {
      lib: {
        entry: {
          index: `./src/index.ts`,
          vue: `./src/vue.ts`,
        },
        formats: ['es'],
      },
      rollupOptions: {
        external: [...Object.keys(devDependencies)],
      },
      outDir: isSsrBuild ? './dist/server' : './dist',
      emptyOutDir: !isSsrBuild,
    },
    plugins: [
      !isSsrBuild && viteDts({
        exclude: ['**/*.spec.ts', '**/*.test.ts', '**/tests/**', '**/__tests__/**'],
        copyDtsFiles: true,
      }),
    ],
  }
})
