import { defineConfig, globalIgnores } from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTs from 'eslint-config-next/typescript';
import eslintPluginPrettier from 'eslint-plugin-prettier/recommended';
import reactCompiler from 'eslint-plugin-react-compiler';

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  eslintPluginPrettier,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    '.next/**',
    'out/**',
    'build/**',
    'next-env.d.ts',
  ]),
  {
    plugins: {
      'react-compiler': reactCompiler,
    },
    rules: {
      // TypeScript 严格模式
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_' },
      ],
      // React 规则
      'react/react-in-jsx-scope': 'off',
      // Prettier 规则
      'prettier/prettier': 'warn',
      // React Compiler - 设为 warn 以不阻止提交
      'react-compiler/react-compiler': 'warn',
      // React Hooks (React Compiler 相关) - 设为 warn 以不阻止提交
      'react-hooks/set-state-in-effect': 'warn',
      'react-hooks/preserve-manual-memoization': 'warn',
    },
  },
]);

export default eslintConfig;
