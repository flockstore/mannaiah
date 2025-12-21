# Authentication & Authorization

Mannaiah implements a secure, permission-based authentication system.

## Logto Integration

We use **Logto** as our external identity provider.
- **JWT**: Stateless authentication is handled via JSON Web Tokens issued by Logto.
- **Guards**: The `JwtAuthGuard` validates the token on protected routes.

## Permissions Pattern

Access control is granular and resource-based. Every asset or feature must be protected following a strict permission pattern.

### Standard Permissions

For any given resource (e.g., `contacts`, `products`, `assets`), the following permissions are defined:

- **`permission:create`**: Allows creating a new resource.
- **`permission:read`**: Allows viewing resources.
- **`permission:update`**: Allows modifying existing resources.
- **`permission:delete`**: Allows removing resources.
- **`permission:manage`**: Grants full administrative access to the resource (superuser capability for that specific scope).

### Implementation

- Use the `@RequirePermissions()` decorator (or equivalent guard mechanism) on controller endpoints to enforce these rules.
- Ensure that the scope strings (e.g., `contacts:create`) match exactly what is defined in the Logto configuration.
