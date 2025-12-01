# Contacts Feature Module

This module provides endpoints to manage contacts with full CRUD operations. Access is controlled via scope-based permissions.

## Scopes

The following scopes are required to access the endpoints:

| Endpoint | Method | Scope | Description |
| :--- | :--- | :--- | :--- |
| `/contacts` | `GET` | `contacts:read` | List all contacts (by email query parameter) |
| `/contacts/document/:documentType/:documentNumber` | `GET` | `contacts:read` | Get a contact by document type and number |
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


For technical details, configuration, and implementation specifics, please refer to [Contacts Module Technical Documentation](../../../docs/contacts-module.md).
