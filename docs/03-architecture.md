# Architecture Overview

Mannaiah follows the standard modular architecture recommended by NestJS, ensuring separation of concerns and maintainability.

## Directory Structure

The `src/` directory is organized as follows:

-   **`app.module.ts`**: The root module that ties everything together.
-   **`main.ts`**: The entry point of the application.
-   **`auth/`**: Contains authentication logic, guards, and strategies.
-   **`core/`**: Holds core infrastructure code, including configuration, exceptions, filters, and database connectivity.
-   **`features/`**: Contains the business logic modules (e.g., Contacts, WooCommerce, Status).

## Core Concepts

### Modules

The application is built using NestJS Modules. The `AppModule` imports feature modules and core infrastructure modules.

### Database

-   **MongoDB**: Used as the primary database.
-   **Mongoose**: Used as the ODM (Object Data Modeling) library.
-   **Schema**: Schemas are defined within their respective feature modules (e.g., `contacts/schemas`).

### Authentication & Authorization

-   **Passport**: Used for authentication strategies.
-   **JWT**: JSON Web Tokens are used for stateless authentication.
-   **Guards**: `JwtAuthGuard` and `PermissionsGuard` (if applicable) protect routes.
-   **Logto**: External identity provider for handling user identities.

### Features

-   **Contacts**: Manages customer information.
-   **WooCommerce**: Syncs orders and customers from WooCommerce.
-   **Status**: Provides system status information.
