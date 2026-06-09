const nextVitals = require('eslint-config-next/core-web-vitals');

module.exports = [
  {
    ignores: ['.next/**', 'coverage/**', 'e2e/**', '**/e2e/**', 'node_modules/**', 'out/**'],
  },
  ...nextVitals,
  {
    files: ['**/*.{ts,tsx,js,jsx}'],
    rules: {
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-var-requires': 'off',
      '@next/next/no-html-link-for-pages': 'off',
      'import/no-anonymous-default-export': 'off',
      'react-hooks/immutability': 'off',
      'react-hooks/purity': 'off',
      'react-hooks/set-state-in-effect': 'off',
    },
  },
];

