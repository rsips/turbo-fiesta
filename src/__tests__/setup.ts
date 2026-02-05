// Jest setup file

// Set test environment variables BEFORE any imports
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret-for-testing-only';
process.env.JWT_EXPIRATION = '24h';
process.env.USE_MOCK_DATA = 'true';
process.env.USER_STORE_PATH = ':memory:';

// Increase timeout for integration tests
jest.setTimeout(10000);
