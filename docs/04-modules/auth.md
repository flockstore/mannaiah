# Auth Module

The `AuthModule` handles authentication and authorization using Logto and JSON Web Tokens (JWT).

## Key Components

-   **`JwtStrategy`**: Implements the Passport JWT strategy to validate bearer tokens. It uses `jwks-rsa` to retrieve the JSON Web Key Set (JWKS) from the Logto issuer.
-   **`JwtAuthGuard`**: A global or route-specific guard that verifies the presence and validity of the JWT.
-   **`PermissionsGuard`**: (If implemented) Checks if the user has specific scopes/permissions required for a route.

## Configuration

Required environment variables:
-   `LOGTO_ISSUER`: The URL of your Logto tenant.
-   `LOGTO_AUDIENCE`: The audience identifier for your API.

## Flow

1.  Client obtains an Access Token from Logto.
2.  Client sends the token in the `Authorization: Bearer <token>` header.
3.  `JwtAuthGuard` intercepts the request.
4.  `JwtStrategy` validates the token signature against keys from `LOGTO_ISSUER`.
5.  If valid, `req.user` is populated with the token payload.
