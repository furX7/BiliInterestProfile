import js from '@eslint/js'
import tseslint from 'typescript-eslint'

export default [
  { ignores: ['node_modules/**', '.output/**', '.wxt/**'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
]
