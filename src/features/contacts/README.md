# Contacts Feature Module

This module provides endpoints to manage contacts with full CRUD operations. It is secured using Logto (JWT) authorization with scope-based permissions.

## Scopes

The following scopes are required to access the endpoints:

| Endpoint | Method | Scope | Description |
| :--- | :--- | :--- | :--- |
| `/contacts` | `GET` | `contacts:read` | List all contacts (by email query parameter) |
| `/contacts/:id` | `GET` | `contacts:read` | Get a specific contact by ID |
| `/contacts` | `POST` | `contacts:create` | Create a new contact |
| `/contacts/:id` | `PUT` | `contacts:update` | Update an existing contact |
| `/contacts/:id` | `DELETE` | `contacts:delete` | Soft delete a contact |

### Wildcard Permissions

The permission system supports wildcard `[resource]:manage` scopes that grant full access to all operations for a specific resource:

- **`contacts:manage`**: Grants access to all contacts endpoints (read, create, update, delete)
- **`products:manage`**: Would grant access to all products endpoints (if implemented)
- **`orders:manage`**: Would grant access to all orders endpoints (if implemented)

The wildcard pattern works for any resource, automatically granting access when a user has `[resource]:manage` for operations requiring any `[resource]:[action]` permission.

## Configuration

Ensure the following environment variables are set:

- **`LOGTO_ISSUER`**: The Logto Issuer URL (e.g., `https://your-tenant.logto.app`)
- **`LOGTO_AUDIENCE`**: The Logto Audience identifier for your API

## Authentication

All endpoints require:
1. A valid JWT token in the `Authorization` header as a Bearer token
2. The JWT must contain the required scope(s) in the `scope` claim

Example request:
```bash
curl -X GET http://localhost:3000/contacts?email=user@example.com \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## Implementation Details

- **Guards**: Uses `AuthGuard('jwt')` for JWT validation and `PermissionsGuard` for scope checking
- **Soft Deletes**: Delete operations are soft deletes (records are marked as deleted, not removed)
- **Validation**: Uses DTOs with class-validator for request validation
- **Database**: Uses MongoDB with Mongoose for data persistence
