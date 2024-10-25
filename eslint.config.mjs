import antfu from '@antfu/eslint-config'

export default antfu({
  rules: {
    'no-redeclare': 'off',
    'no-console': 'off',
  },
  formatters: true,
})
