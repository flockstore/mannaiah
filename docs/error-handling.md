# Error Handling Standardization

## Overview

All errors in the Mannaiah API now follow a consistent format:

```json
{
  "statusCode": number,
  "message": string,
  "details": any | null
}
```

## Implementation

### Global Exception Filter

The `AllExceptionsFilter` (`src/core/filters/all-exceptions.filter.ts`) is registered globally in `main.ts` and handles all exceptions:

- **HTTP Exceptions**: Extracts status code, message, and details from NestJS exceptions
- **MongoDB Errors**: Converts MongoDB errors (especially duplicate key errors) to proper HTTP responses
- **Generic Errors**: Catches any other errors and returns 500 with appropriate details

### Error Response Examples

#### Validation Error (400)
```json
{
  "statusCode": 400,
  "message": "Validation failed",
  "details": ["field1 is required", "field2 must be a string"]
}
```

#### Custom Business Logic Error (400)
```json
{
  "statusCode": 400,
  "message": "Cannot have both legalName and personal names",
  "details": "A contact must be either a legal entity (with legalName) OR a natural person (with firstName and lastName), but not both"
}
```

#### Duplicate Key Error (409)
```json
{
  "statusCode": 409,
  "message": "Duplicate key error",
  "details": {
    "documentType": "CC",
    "documentNumber": "1192793653"
  }
}
```

#### Not Found Error (404)
```json
{
  "statusCode": 404,
  "message": "Contact with ID 123 not found",
  "details": null
}
```

#### Internal Server Error (500)
```json
{
  "statusCode": 500,
  "message": "Internal server error",
  "details": null
}
```

## Custom Error Classes

When creating custom error classes, pass an object with `message` and `details`:

```typescript
export class CustomError extends BadRequestException {
  constructor() {
    super({
      message: 'Short error message',
      details: 'Detailed explanation or additional context',
    })
  }
}
```

## Benefits

1. **Consistency**: All API errors follow the same structure
2. **Client-Friendly**: Clients can always expect the same fields
3. **Debugging**: The `details` field provides additional context for debugging
4. **Type Safety**: TypeScript ensures proper error handling
5. **Performance**: Single global filter handles all exceptions efficiently
