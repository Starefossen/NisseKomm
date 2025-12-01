# Testing Guide - Session & Sanity Storage

This directory contains integration tests for the multi-tenant session authentication and Sanity storage backend.

## Test Files

### `session-auth.test.ts`

Unit tests for password hashing and session management:

- Password hashing (SHA-256) consistency
- Session ID creation and persistence
- Cookie and localStorage fallback
- Multi-tenant isolation
- Edge cases (special characters, Unicode, etc.)

### `sanity-storage.test.ts`

**Integration tests using real Sanity backend** (no mocking):

- Basic CRUD operations
- Multi-tenant data isolation
- Cross-device synchronization
- Complex data types (badges, symbols, etc.)
- GameEngine integration
- Error handling and performance

## Prerequisites

### 1. Environment Setup

Create `.env.test.local` with Sanity development dataset credentials:

```bash
# Sanity Configuration (DEVELOPMENT dataset)
NEXT_PUBLIC_SANITY_PROJECT_ID=your_project_id
NEXT_PUBLIC_SANITY_DATASET=development  # Use development, not production!
NEXT_PUBLIC_SANITY_API_VERSION=2024-11-01
SANITY_API_TOKEN=your_write_token

# Storage Backend
NEXT_PUBLIC_STORAGE_BACKEND=sanity
```

**IMPORTANT**: Always use `development` dataset for tests, never `production`!

### 2. Sanity Schema Deployment

Ensure the `userSession` schema is deployed to your Sanity development dataset:

```bash
cd sanity
pnpm sanity deploy
```

### 3. Development Server (for API routes)

The Sanity storage tests require Next.js API routes to be running:

```bash
# Terminal 1: Start dev server
pnpm dev

# Terminal 2: Run tests
pnpm test
```

## Running Tests

### Run All Tests

```bash
pnpm test
```

### Run Specific Test Suite

```bash
# Session authentication only
pnpm test session-auth

# Sanity storage integration only
pnpm test sanity-storage
```

### Run in Watch Mode

```bash
pnpm test --watch
```

### Run with Coverage

```bash
pnpm test --coverage
```

## Test Behavior

### Session Authentication Tests

- ✅ Fast (no network calls)
- ✅ Isolated (no external dependencies)
- ✅ Can run without dev server

### Sanity Storage Tests

- ⚠️ Slower (real API calls to Sanity)
- ⚠️ Requires dev server (uses `/api/session` routes)
- ⚠️ Creates real sessions in development dataset
- ✅ Uses unique passwords per test (no cross-contamination)
- ✅ Background sync delays included (1s wait)

## Test Data Cleanup

Each test uses a unique password generated from `Date.now()`, so sessions don't interfere with each other. Test sessions are **automatically cleaned up** after the test suite completes.

### Automatic Cleanup

The `sanity-storage.test.ts` file includes an `afterAll()` hook that:

1. Tracks all sessionIds created during tests
2. Deletes them from Sanity via DELETE endpoint after tests complete
3. Prevents test data accumulation in development dataset
4. Runs with 30 second timeout to handle all deletions

### Manual Cleanup (If Needed)

If automated cleanup fails, you have two options:

#### Option 1: Run cleanup script

```bash
pnpm cleanup:test-sessions
```

This script finds and deletes all sessions with `TEST_` prefix from Sanity.

#### Option 2: Use Sanity Studio

1. Open Sanity Studio: `pnpm sanity:dev`
2. Navigate to "User Session" documents
3. Filter for sessions starting with "TEST\_"
4. Delete as needed

## Debugging Failed Tests

### Check Sanity Connection

```bash
# Verify credentials
curl -H "Authorization: Bearer $SANITY_API_TOKEN" \
  "https://$NEXT_PUBLIC_SANITY_PROJECT_ID.api.sanity.io/v1/data/query/$NEXT_PUBLIC_SANITY_DATASET?query=*[_type == 'userSession'][0]"
```

### Enable Verbose Logging

Add to test file:

```typescript
beforeAll(() => {
  console.debug("Sanity Config:", {
    projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
    dataset: process.env.NEXT_PUBLIC_SANITY_DATASET,
    backend: process.env.NEXT_PUBLIC_STORAGE_BACKEND,
  });
});
```

### Check Dev Server

Ensure `http://localhost:3000/api/session` responds:

```bash
curl http://localhost:3000/api/session
# Expected: {"error":"No session ID in cookie"} (404)
```

## Common Issues

### "Failed to fetch session" Errors

- **Cause**: Dev server not running
- **Fix**: Start `pnpm dev` before running tests

### "CORS" or "Network" Errors

- **Cause**: API routes not accessible
- **Fix**: Check dev server is on port 3000

### "Unauthorized" Errors

- **Cause**: Invalid SANITY_API_TOKEN
- **Fix**: Generate new token with write permissions

### Tests Timing Out

- **Cause**: Sanity API slow or unreachable
- **Fix**: Check internet connection, increase Jest timeout

### "Session not found" After Creation

- **Cause**: Background sync didn't complete
- **Fix**: Increase `waitForSync()` delay from 1s to 2s

## CI/CD Considerations

For GitHub Actions or other CI:

1. Add Sanity credentials as secrets
2. Set up development dataset specifically for CI
3. Consider longer sync wait times (network latency)
4. Run dev server in background before tests

Example GitHub Actions workflow:

```yaml
- name: Setup Environment
  run: |
    echo "NEXT_PUBLIC_STORAGE_BACKEND=sanity" >> .env.test.local
    echo "NEXT_PUBLIC_SANITY_PROJECT_ID=${{ secrets.SANITY_PROJECT_ID }}" >> .env.test.local
    echo "NEXT_PUBLIC_SANITY_DATASET=ci" >> .env.test.local
    echo "SANITY_API_TOKEN=${{ secrets.SANITY_TOKEN }}" >> .env.test.local

- name: Start Dev Server
  run: pnpm dev &

- name: Wait for Server
  run: npx wait-on http://localhost:3000

- name: Run Tests
  run: pnpm test
```

## Performance Notes

- **Session auth tests**: ~500ms total
- **Sanity storage tests**: ~15-30s total (real API calls)
- Each Sanity test includes 1s sync delay
- Tests run sequentially to avoid rate limits

## Best Practices

1. ✅ Always use `development` dataset, never `production`
2. ✅ Each test uses unique password (no isolation issues)
3. ✅ Include `await waitForSync()` after mutations
4. ✅ Clear localStorage in `beforeEach()` hooks
5. ✅ Test multi-tenancy with different passwords
6. ❌ Don't mock Sanity (integration tests validate real behavior)
7. ❌ Don't share passwords between tests
8. ❌ Don't rely on execution order

## Future Improvements

- [x] Add test data cleanup in `afterAll()` ✅
- [ ] Mock Next.js API routes for faster tests
- [ ] Add performance benchmarks
- [ ] Test offline/error scenarios
- [ ] Add E2E tests with Playwright
- [ ] Test concurrent session updates
