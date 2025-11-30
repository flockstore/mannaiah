# Contacts Module

This module provides endpoints to manage contacts. It is secured using Logto (JWT) authorization.

## Scopes

The following scopes are required to access the endpoints:

| Endpoint | Method | Scope | Description |
| :--- | :--- | :--- | :--- |
| `/contacts` | `GET` | `contacts:read` | List all contacts |
| `/contacts/:id` | `GET` | `contacts:read` | Get a specific contact |
| `/contacts` | `POST` | `contacts:create` | Create a new contact |
| `/contacts/:id` | `PATCH` | `contacts:update` | Update an existing contact |
| `/contacts/:id` | `DELETE` | `contacts:delete` | Delete a contact |
| `*` | `*` | `[resource]:manage` | Full access to all endpoints for a specific resource (e.g. `contacts:manage` for contacts) |

## Configuration

Ensure the following environment variables are set:

- `LOGTO_ISSUER`: The Logto Issuer URL.
- `LOGTO_AUDIENCE`: The Logto Audience.

## Usage

### Create a Contact

```bash
curl -X POST http://localhost:3000/contacts \
  -H "Authorization: Bearer <your_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "1234567890"
  }'
```

### List Contacts

```bash
curl http://localhost:3000/contacts \
  -H "Authorization: Bearer <your_token>"
```
