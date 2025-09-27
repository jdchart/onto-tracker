module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  moduleNameMapping: {
    '^scripts/(.*)$': '<rootDir>/scripts/$1',
    '^assets/(.*)$': '<rootDir>/assets/$1',
    '^obsidian$': '<rootDir>/__mocks__/obsidian.ts'
  },
  testMatch: [
    '**/__tests__/**/*.test.ts',
    '**/?(*.)+(spec|test).ts'
  ],
  collectCoverageFrom: [
    'scripts/**/*.ts',
    'main.ts',
    '!scripts/**/*.d.ts',
    '!**/__tests__/**',
    '!**/node_modules/**'
  ],
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  transform: {
    '^.+\\.(ts|tsx)$': 'ts-jest'
  },
  testPathIgnorePatterns: [
    '/node_modules/',
    '/build/',
    '/dist/'
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  transformIgnorePatterns: [
    'node_modules/(?!(gray-matter|xml2js)/)'
  ],
  globals: {
    'ts-jest': {
      isolatedModules: true
    }
  }
};