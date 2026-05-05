import type { Config } from 'jest';
import nextJest from 'next/jest';

const createJestConfig = nextJest({
  dir: './',
});

const config: Config = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  testEnvironment: 'jest-environment-jsdom',
  preset: 'ts-jest',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
  testPathIgnorePatterns: [
    '<rootDir>/node_modules/', 
    '<rootDir>/.next/', 
    '<rootDir>/e2e/', 
    '<rootDir>/bewaproperties/', 
    '<rootDir>/functions/'
  ],
  modulePathIgnorePatterns: [
    '<rootDir>/bewaproperties/', 
    '<rootDir>/functions/'
  ],
};

export default createJestConfig(config);
