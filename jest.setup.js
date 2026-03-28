import '@testing-library/jest-dom';

// Mock environment variables
process.env.SUPABASE_URL = 'https://test.supabase.co';
process.env.SUPABASE_ANON_KEY = 'test-anon-key';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-key';
process.env.REDDIT_CLIENT_ID = 'test-reddit-id';
process.env.REDDIT_CLIENT_SECRET = 'test-reddit-secret';
process.env.NEWS_API_KEY = 'test-news-key';
process.env.HYPERLIQUID_API_KEY = 'test-hl-key';
process.env.HYPERLIQUID_PRIVATE_KEY = 'test-hl-private';
process.env.HYPERLIQUID_TESTNET = 'true';

// Mock fetch globally
global.fetch = jest.fn();

// Reset mocks before each test
beforeEach(() => {
  jest.clearAllMocks();
});
