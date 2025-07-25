module.exports = {
  // Extend Create React App's ESLint config for compatibility
  extends: [
    'react-app',
    'react-app/jest',
    'prettier' // MUST be last to override formatting rules
  ],

  // Parser options for modern JavaScript
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
    ecmaFeatures: {
      jsx: true
    }
  },

  // Environment settings
  env: {
    browser: true,
    node: true,
    es6: true,
    jest: true
  },

  // Global variables
  globals: {
    // Electron globals
    require: 'readonly',
    process: 'readonly',
    __dirname: 'readonly',
    __filename: 'readonly',
    Buffer: 'readonly',
    global: 'readonly'
  },

  // Configure Prettier integration
  plugins: ['prettier'],

  // Additional rules for code quality (no formatting rules - Prettier handles those)
  rules: {
    // Prettier integration
    'prettier/prettier': ['error', { endOfLine: 'auto' }],
    // General JavaScript rules (logic, not formatting)
    'no-console': ['warn', { allow: ['warn', 'error'] }],
    'no-debugger': 'warn',
    'no-unused-vars': [
      'error',
      {
        varsIgnorePattern: '^_',
        argsIgnorePattern: '^_',
        ignoreRestSiblings: true
      }
    ],
    'prefer-const': 'error',
    'no-var': 'error',
    'no-duplicate-imports': 'error',
    'eol-last': ['error', 'always'],

    // React-specific rules (behavior, not formatting)
    'react/jsx-uses-react': 'off', // Not needed in React 17+
    'react/react-in-jsx-scope': 'off', // Not needed in React 17+
    'react/jsx-fragments': ['error', 'syntax'],
    'react/jsx-no-useless-fragment': 'error',
    'react/jsx-pascal-case': 'error',
    'react/jsx-no-duplicate-props': 'error',
    'react/jsx-no-undef': 'error',
    'react/no-array-index-key': 'warn',
    'react/no-deprecated': 'error',
    'react/no-direct-mutation-state': 'error',
    'react/no-unused-prop-types': 'warn',
    'react/no-unused-state': 'warn',
    'react/prefer-stateless-function': 'warn',
    'react/prop-types': 'off', // We're not using PropTypes
    'react/self-closing-comp': 'error',
    'react/sort-comp': 'error',

    // React Hooks rules
    'react-hooks/rules-of-hooks': 'error',
    'react-hooks/exhaustive-deps': 'warn',

    // Import/Export rules (organization, not formatting)
    'import/order': [
      'error',
      {
        groups: [
          'builtin',
          'external',
          'internal',
          'parent',
          'sibling',
          'index'
        ],
        'newlines-between': 'never',
        alphabetize: { order: 'asc', caseInsensitive: true }
      }
    ],
    'import/no-duplicates': 'error',
    'import/no-unused-modules': 'off', // Can be resource intensive
    'import/first': 'error',
    'import/newline-after-import': 'error',
    'import/no-anonymous-default-export': 'warn',

    // Testing Library rules
    'testing-library/no-node-access': 'warn',

    // Accessibility rules (less strict for desktop app)
    'jsx-a11y/alt-text': 'warn',
    'jsx-a11y/anchor-has-content': 'warn',
    'jsx-a11y/anchor-is-valid': 'warn',
    'jsx-a11y/click-events-have-key-events': 'off', // Desktop app context
    'jsx-a11y/no-static-element-interactions': 'off', // Desktop app context
    'jsx-a11y/no-noninteractive-element-interactions': 'off' // Desktop app context
  },

  // Override rules for specific file patterns
  overrides: [
    {
      // Electron main process files
      files: ['public/electron.js', 'public/**/*.js'],
      env: {
        node: true,
        browser: false
      },
      rules: {
        'no-console': 'off', // Console logging is normal in Electron main process
        'import/no-nodejs-modules': 'off'
      }
    },
    {
      // Test files
      files: ['**/__tests__/**/*.js', '**/*.test.js', '**/*.spec.js'],
      env: {
        jest: true
      },
      rules: {
        'no-console': 'off', // Console statements are OK in tests
        'testing-library/no-node-access': 'warn' // More lenient in tests
      }
    },
    {
      // Build and config files
      files: ['build/**/*.js', 'assets/**/*.js', '*.config.js'],
      env: {
        node: true
      },
      rules: {
        'no-console': 'off'
      }
    },
    {
      // Utility files - allow more console logging
      files: ['src/utils/**/*.js'],
      rules: {
        'no-console': ['warn', { allow: ['warn', 'error', 'log'] }]
      }
    }
  ]
};
