# Coding Guidelines

To maintain a high-quality codebase, we adhere to the following strict guidelines:

## Code Quality

- **Self-Explanatory Code**: Variable and function names should be descriptive enough that the logic is obvious without reading comments.
- **Reusability**: Logic should be modular. Avoid duplication; if logic is used in more than one place, extract it into a service or utility.

## Documentation Requirements

### Swagger (OpenAPI)

All API endpoints must be fully documented using Swagger decorators (`@nestjs/swagger`).

- **Operations**: Use `@ApiOperation` to describe what the endpoint does.
- **Responses**: Explicitly document all possible responses, including success and error scenarios, using `@ApiResponse`.
  - **Status Codes**: Clearly define what each status code means (e.g., 200, 201, 400, 404, 500).
  - **Return Types**: Specify the return type schema.

### TSDoc

- **Everything Documented**: Classes, methods, properties, and interfaces must have TSDoc comments explaining their purpose, parameters (`@param`), and return values (`@returns`).
- **No Internal Comments**: Avoid using `//` comments inside function bodies to explain "how" code works. The code itself should be clear. If complex logic exists, refactor it or explain the "why" in the TSDoc block above the function.

## Example

```typescript
/**
 * Retrieves a paginated list of contacts.
 *
 * @param query - The pagination and filter query parameters.
 * @returns An observable containing the paginated list of contacts.
 */
@Get()
@ApiOperation({ summary: 'Get all contacts' })
@ApiResponse({ status: 200, description: 'Return all contacts.' })
@ApiResponse({ status: 403, description: 'Forbidden.' })
findAll(@Query() query: PaginationDto): Observable<PaginatedResult<Contact>> {
  return this.contactsService.findAll(query);
}
```
