# Core Module

The `CoreModule` provides the foundational infrastructure for the application. It handles configuration, database connections, and global exception handling.

## Components

### Configuration (`src/core/config`)
-   **ConfigModule**: Loads environment variables using `@nestjs/config`.
-   **Validation**: Ensures required environment variables are present and valid.

### Database (`src/core/mongo`)
-   **MongoModule**: Manages the connection to MongoDB using `MongooseModule`.
-   **Global Setup/Teardown**: Scripts in `test/` (referenced in `package.json`) handle database state for testing.

### Filters (`src/core/filters`)
-   **Global Exception Filter**: Catches exceptions across the application and formats standard API responses.
-   **Mongo Exception Filter**: Specifically handles MongoDB errors (e.g., duplicate keys) and maps them to appropriate HTTP status codes (e.g., 409 Conflict).

## Usage

The `CoreModule` is imported once in `AppModule`. It should not be imported by feature modules directly to avoid circular dependencies and ensure singleton behavior for core providers.
