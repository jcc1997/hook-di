// @ts-check
import path from 'path'
import ts from 'rollup-plugin-typescript2'
import resolve from '@rollup/plugin-node-resolve'
import commonjs from '@rollup/plugin-commonjs'

const pkg = require('./package.json')

function getAuthors(pkg) {
  const { contributors, author } = pkg

  const authors = new Set()
  if (contributors && contributors)
    contributors.forEach((contributor) => {
      authors.add(contributor.name)
    })
  if (author) authors.add(author.name)

  return Array.from(authors).join(', ')
}

const banner = `/*!
  * ${pkg.name} v${pkg.version}
  * (c) ${new Date().getFullYear()} ${getAuthors(pkg)}
  * @license MIT
  */`

const packageConfigs = [createConfig('es'), createConfig('cjs')]

export default packageConfigs

function createConfig(format) {
  const output = {};
  // output.sourcemap = !!process.env.SOURCE_MAP
  output.banner = banner
  output.externalLiveBindings = false
  output.globals = {
    'vue-demi': 'VueDemi',
  }
  output.dir = `dist/${format}`
  output.name = 'HookDi'
  output.format = format

  const tsPlugin = ts({
    check: false,
    tsconfig: path.resolve(__dirname, './tsconfig.json'),
    cacheRoot: path.resolve(__dirname, './node_modules/.rts2_cache'),
    tsconfigOverride: {
      compilerOptions: {
        sourceMap: output.sourcemap,
        declaration: true,
        declarationMap: true,
      },
      exclude: ['tests'],
    },
  })

  const external = ['vue-demi']

  const nodePlugins = [resolve(), commonjs()]

  return {
    input: ['src/index.ts', 'src/vue.ts'],
    external,
    plugins: [
      tsPlugin,
      ...nodePlugins,
    ],
    output,
  }
}
