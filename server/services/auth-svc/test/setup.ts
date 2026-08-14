import 'reflect-metadata';

// Global test timeout
jest.setTimeout(10000);

// Mock environment variables
process.env.JWT_ACCESS_SECRET = 'test-jwt-access-secret';
process.env.JWT_REFRESH_SECRET = 'test-jwt-refresh-secret';
process.env.JWT_ACCESS_EXPIRY = '1h';
process.env.JWT_REFRESH_EXPIRY = '7d';

// Clear mocks after each test
afterEach(() => {
  jest.clearAllMocks();
});