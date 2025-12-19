# Contacts Module

The `ContactsModule` is responsible for managing customer data within the application.

## Features

-   **CRUD Operations**: Create, Read, Update, and Delete contacts.
-   **Schema**:
    -   `firstName` (string)
    -   `lastName` (string)
    -   `email` (string, unique)
    -   `phone` (string)
    -   `wooId` (number, optional): Links the contact to a WooCommerce customer ID.
-   **Controllers**: Expose RESTful endpoints for contact management.
-   **Services**: Handle business logic and database interactions.

## Integration

Contacts can be created manually via the API or synchronized automatically from WooCommerce orders.
