process.env.NODE_ENV = 'test';
process.env.CORS_ORIGINS = 'http://localhost:5173';

// API suites import createApp → routes → config/supabase, which throws if these
// are unset. Placeholders are enough; auth/DB are mocked in setupMocks.ts.
process.env.SUPABASE_URL ??= 'https://example.supabase.co';
process.env.SUPABASE_PUBLISHABLE_KEY ??= 'test-publishable-key';
process.env.SUPABASE_SERVICE_ROLE_KEY ??= 'test-service-role-key';
