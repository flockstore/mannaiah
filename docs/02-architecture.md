# Architecture Overview

Mannaiah follows the standard modular architecture recommended by NestJS, ensuring separation of concerns and maintainability.

## Folder Structure

The application follows a modular feature-based structure. Each feature (e.g., `src/features/contacts`) must allow for a self-contained separation of concerns.

The typical structure for a feature folder is:

- **`controllers/`**: Handles incoming HTTP requests and responses.
- **`services/`**: Contains business logic and interacts with repositories.
- **`repositories/`**: Handles database interactions (DAL).
- **`schemas/`**: Defines MongoDB schemas (Mongoose).
- **`dtos/`**: Data Transfer Objects for validation and type safety.
- **`interfaces/`**: TypeScript interfaces for the feature.
- **`errors/`**: Custom error classes for the feature.
- **`utils/`**: Helper functions specific to the feature.
- **`[feature].module.ts`**: The feature module definition.

## Database & Data Access

- **MongoDB**: Used as the primary database.
- **Mongoose**: Used as the ODM.

### CRUD & Mongoose Query System

We use a standardized "Repository Pattern" extending a `BaseRepository<T>`.

- **BaseRepository**: Provides common methods like `create`, `findById`, `findAll`, `update`, `softDelete`, and `restore`.
- **Pagination**: The system includes a robust pagination system (`findAllPaginated`) that supports filtering and soft-delete options (`withDeleted: true`).
- **Query Options**: All queries support optional configurations to handle soft-deleted documents.

## Error Handling

Mannaiah uses a global error handling strategy to ensure consistency:

- **Structure**: All errors return a standard JSON format:
  ```json
  {
    "statusCode": number,
    "message": string,
    "details": any | null
  }
  ```
- **Global Filter**: An `AllExceptionsFilter` catches all exceptions (HTTP, MongoDB, Generic) and formats them accordingly.
- **Custom Errors**: Specific business errors should extend standard NestJS exceptions (e.g., `BadRequestException`) and provide detailed context.

## Testing

Reliability is paramount.

- **E2E Testing**: **Mandatory** for all features. Tests must be located in `test/e2e/` and use a consistent setup with `createE2EApp`.
- **Unit Testing**: Required for services and complex logic.

## Configuration

Configuration is managed via NestJS `ConfigModule` and environment variables. Key configurations (database URIs, API keys, etc.) must never be hardcoded and should be accessed via the `ConfigService`.

## Quality Assurance

Every build **must** pass the following checks before deployment or merging:
1. `npm run lint`: Ensures code style and quality.
2. `npm run test`: Ensures unit tests pass.
