module.exports = {
  testEnvironment: 'jsdom',
  moduleDirectories: ['node_modules', 'src'],
  setupFilesAfterEnv: ['<rootDir>/src/setupTests.js'],
  testMatch: [
    '<rootDir>/src/**/__tests__/**/*.{js,jsx,ts,tsx}',
    '<rootDir>/src/**/*.{test,spec}.{js,jsx,ts,tsx}'
  ],
  moduleNameMapper: {
    '\.(css|less|scss|sass)$': 'identity-obj-proxy',
    '^jspdf$': '<rootDir>/node_modules/jspdf/dist/jspdf.node.min.js'
  },
  // @absolute-scenes/git-sync ships as native ESM ("type": "module") with no
  // CommonJS build. Jest's default transformIgnorePatterns excludes all of
  // node_modules from Babel transform, so without this override importing
  // that package throws "Unexpected token 'export'" (its source is never
  // converted to CJS). Carve out just this package so Babel transforms it
  // like our own source, while everything else in node_modules stays
  // untransformed as usual.
  transformIgnorePatterns: [
    '/node_modules/(?!@absolute-scenes/git-sync/)'
  ],
  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': ['babel-jest', {
      presets: [
        ['@babel/preset-env', { targets: { node: 'current' } }],
        ['@babel/preset-react', { runtime: 'automatic' }]
      ]
    }]
  },
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    '!src/index.js',
    '!src/reportWebVitals.js',
    '!src/**/*.test.{js,jsx,ts,tsx}',
    '!src/**/__tests__/**'
  ],
  coverageReporters: ['text', 'lcov', 'html'],
  coverageDirectory: 'coverage'
};
