# Status Feature

The Status feature provides endpoints to verify the operational status of the application and the validity of authentication tokens. This is useful for health checks, monitoring, and client-side session validation.

## Endpoints

### 1. Get Application Status
- **URL**: `/status`
- **Method**: `GET`
- **Auth Required**: No
- **Description**: Returns a simple JSON object indicating that the application is running. This endpoint is unguarded and can be used by load balancers or monitoring tools.
- **Response**:
  ```json
  {
    "status": "ok"
  }
  ```

### 2. Check Authentication
- **URL**: `/check-auth`
- **Method**: `GET`
- **Auth Required**: Yes (JWT)
- **Description**: Verifies that the provided Bearer token is valid. If the token is valid, it returns a 200 OK status. If invalid or missing, it returns 401 Unauthorized.
- **Response**:
  ```json
  {
    "status": "authenticated"
  }
  ```

## Integration

This feature is registered in the `StatusModule` and is part of the main application module. It does not depend on any database or external service, making it a reliable indicator of the API's responsiveness.
