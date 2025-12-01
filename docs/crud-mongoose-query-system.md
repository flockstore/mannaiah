# CRUD, Mongoose & Query Behavior System

This document describes the global system specification for CRUD operations, Mongoose models, and query behavior in the application.

## Mongoose Models & Schemas

### Soft Delete & Timestamps
All models should use the global plugins for soft delete and timestamps:
- `softDeletePlugin`: Adds `isDeleted` and `deletedAt` fields.
- `timestampPlugin`: Adds `createdAt` and `updatedAt` fields.

### Indexes
- Use standard indexes for frequently queried fields.
- Use **sparse unique indexes** for optional unique fields (e.g., `documentType` + `documentNumber` where documents can be missing).

## Repository Pattern

All features should implement a Repository extending `BaseRepository<T>`.

### BaseRepository Features
- `create(data)`: Creates a new document.
- `findById(id)`: Finds by ID.
- `findAll(filter, options)`: Finds all matching documents (internal use).
- `update(id, data)`: Updates by ID.
- `softDelete(id)`: Soft deletes by ID.
- `restore(id)`: Restores a soft-deleted document.

### Custom Repositories
- Extend `BaseRepository`.
- Implement specific query methods.
- **Pagination**: Implement `findAllPaginated(query, page, limit)` for public listing endpoints.

## 6. Query Options & Soft Delete Integration

All query methods in `BaseRepository` and `BaseService` support `QueryOptions` to control soft delete behavior:

```typescript
interface QueryOptions {
  withDeleted?: boolean  // Include soft-deleted documents
}
```

### Example Usage

```typescript
// Only non-deleted documents (default)
const contacts = await lastValueFrom(
  contactService.findAll({})
)

// Include soft-deleted documents
const allContacts = await lastValueFrom(
  contactService.findAll({}, { withDeleted: true })
)
```

---

## 7. Pagination System

The base repository and service provide standardized pagination functionality that works consistently across all features and respects soft delete settings.

### 7.1 Pagination in BaseRepository

The `findAllPaginated` method is available in all repositories extending `BaseRepository`:

```typescript
findAllPaginated(
  filter: FilterQuery<T> = {},
  page: number = 1,
  limit: number = 10,
  options?: QueryOptions,
): Observable<{ data: T[]; total: number; page: number; limit: number }>
```

**Parameters:**
- `filter`: MongoDB filter query
- `page`: Page number (1-based indexing)
- `limit`: Items per page
- `options`: Query options including `withDeleted` flag

**Returns:**
- `data`: Array of documents for the current page
- `total`: Total count of documents matching the filter
- `page`: Current page number
- `limit`: Items per page

### 7.2 Pagination in BaseService

Services automatically inherit pagination from `BaseService`:

```typescript
// In any service extending BaseService
findAllPaginated(
  filter: FilterQuery<T> = {},
  page: number = 1,
  limit: number = 10,
  options?: QueryOptions,
): Observable<{ data: T[]; total: number; page: number; limit: number }>
```

### 7.3 Pagination Examples

**Basic Pagination:**
```typescript
// Get first page with 10 items
const result = await lastValueFrom(
  contactService.findAllPaginated({}, 1, 10)
)

console.log(result.data)      // Array of contacts
console.log(result.total)     // Total count
console.log(result.page)      // 1
console.log(result.limit)     // 10
```

**Filtered Pagination:**
```typescript
// Get second page of contacts with specific email domain
const result = await lastValueFrom(
  contactService.findAllPaginated(
    { email: { $regex: '@example.com$' } },
    2,
    20
  )
)
```

**Including Soft-Deleted Documents:**
```typescript
// Get all contacts including deleted ones
const result = await lastValueFrom(
  contactService.findAllPaginated(
    {},
    1,
    10,
    { withDeleted: true }
  )
)
```

### 7.4 Feature-Specific Pagination Customization

Repositories can override `findAllPaginated` to add feature-specific preprocessing. For example, the `ContactRepository` normalizes email queries:

```typescript
// In ContactRepository
findAllPaginated(
  filter: FilterQuery<ContactDocument> = {},
  page: number = 1,
  limit: number = 10,
  options?: QueryOptions,
): Observable<{ data: ContactDocument[]; total: number; page: number; limit: number }> {
  // Normalize email to lowercase for case-insensitive search
  if (filter.email) {
    filter.email = (filter.email as string).toLowerCase()
  }

  // Call parent implementation with preprocessed filter
  return super.findAllPaginated(filter, page, limit, options)
}
```

### 7.5 Pagination in Controllers

Controllers should use pagination for list endpoints:

```typescript
@Get()
@ApiOperation({ summary: 'Get items with pagination' })
@ApiQuery({ name: 'page', required: false, type: Number })
@ApiQuery({ name: 'limit', required: false, type: Number })
findAll(
  @Query('page') page: number = 1,
  @Query('limit') limit: number = 10,
  @Query() filters: any,
): Observable<{ data: T[]; meta: { page: number; total: number; limit: number } }> {
  const { page: _, limit: __, ...queryFilters } = filters

  return this.service.findAllPaginated(queryFilters, +page, +limit).pipe(
    map((result) => ({
      data: result.data,
      meta: {
        page: result.page,
        total: result.total,
        limit: result.limit,
      },
    })),
  )
}
```

---

## 8. Best Practices Layer

Services should wrap repositories and contain business logic.
- **Validation**: Perform business validation (e.g., name combinations) before calling repository methods.
- **Mapping**: Map DTOs to domain objects if necessary.
- **Error Handling**: Throw domain-specific errors (e.g., `NotFoundException`, `BadRequestException`) which are caught by global filters or controllers.

## API & Query Standardization

### GET Requests
- **Single Resource**: `GET /resource/:id`
    - Returns the resource or 404.
- **List Resources**: `GET /resource`
    - **Pagination**: Always supported via `page` (default 1) and `limit` (default 10).
    - **Filtering**: Supports generic query parameters (e.g., `?email=...`, `?status=...`).
    - **Response Format**:
      ```json
      {
        "data": [...],
        "total": 100,
        "page": 1,
        "limit": 10
      }
      ```
    - **Single Match**: Even if querying by a unique field (e.g., `?email=unique@email.com`), the response MUST be the paginated structure with a list (containing 1 item).

### Query Parameters
- **Pagination**: `page`, `limit` (numbers).
- **Filtering**: Any other query parameter is treated as a filter on the model fields.
- **Sanitization**: Services/Repositories should sanitize inputs (e.g., lowercase emails, trim strings) before querying.

## Example: Contacts Feature

- **Model**: `Contact` (optional document fields).
- **Endpoints**:
    - `GET /contacts/:id`: Get single contact.
    - `GET /contacts?email=foo@bar.com`: Get list of contacts (paginated).
    - `POST /contacts`: Create contact.
    - `PUT /contacts/:id`: Update contact.
    - `DELETE /contacts/:id`: Soft delete contact.
