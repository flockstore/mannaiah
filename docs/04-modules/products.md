# Products Module

The `ProductsModule` is responsible for managing the product catalog, including galleries, datasheets, and variations.

## Features

-   **CRUD Operations**: Create, Read, Update, and Delete products.
-   **Schema**:
    -   `_id` (string, UUID): Unique identifier.
    -   `sku` (string, unique): Stock Keeping Unit.
    -   `gallery` (array): List of product images (linked to Assets).
    -   `datasheets` (array): Realm-specific product information (name, description, attributes).
    -   `variations` (array): List of variation IDs.
-   **Controllers**: Expose RESTful endpoints for product management.
-   **Services**: Handle business logic, including validations for gallery (unique main image) and variation existence.

## Integration

-   **Assets**: Uses `AssetsService` to validate gallery images.
-   **Variations**: Uses `VariationsService` to validate linked variations.
