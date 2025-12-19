# End-to-End Testing

We use Jest and Supertest for E2E testing. The tests are located in `test/e2e/`.

## Structure

-   **`test/e2e/test-utils.ts`**: Shared setup/teardown logic. Creates a Nest application with:
    -   In-memory MongoDB (`mongodb-memory-server`)
    -   Mocked Auth Guards
    -   Mocked Storage Service
    -   Global Pipes & Filters matching production (`ValidationPipe`, `AllExceptionsFilter`)
-   **`test/e2e/products/`**: Product feature integration tests.
-   **`test/e2e/contacts/`**: Contact feature tests (CRUD, Validation, Soft Delete).
-   **`test/e2e/assets/`**: Asset upload/retrieval verification.
-   **`test/e2e/variations/`**: Variation management tests.
-   **`test/e2e/woocommerce/`**: Placeholder for future WC integration tests.

## Running Tests

Run all E2E tests:
```bash
npm run test:e2e
```

## Writing Tests

Use the helper to bootstrap the app:

```typescript
import { createE2EApp, closeE2EApp, E2ETestContext } from '../test-utils'

describe('Feature (e2e)', () => {
    let context: E2ETestContext
    let app: INestApplication

    beforeAll(async () => {
        context = await createE2EApp()
        app = context.app
    })

    afterAll(async () => {
        await closeE2EApp(context)
    })

    // ... tests using request(app.getHttpServer())
})
```
