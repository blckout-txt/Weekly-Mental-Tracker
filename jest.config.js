/**
 * The test suite covers the pure logic layer (src/domain, src/utils) — the
 * scoring, aggregation and date maths that the rest of the app leans on.
 * None of it imports React Native, so a plain node environment is all it needs.
 */
module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/__tests__/**/*.test.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  transform: {
    // Reuse the project's own Babel setup so tests compile the source exactly
    // the way Metro does when bundling the app.
    '^.+\\.tsx?$': ['babel-jest', { configFile: './babel.config.js' }],
  },
};
