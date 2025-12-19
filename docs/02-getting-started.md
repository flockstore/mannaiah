# Getting Started

This guide will help you set up the Mannaiah project locally for development.

## Prerequisites

Ensure you have the following installed on your machine:

- **Node.js**: v18 or later recommended.
- **npm**: Comes with Node.js.
- **MongoDB**: A running instance of MongoDB (local or cloud).

## Installation

1.  **Clone the repository**:
    ```bash
    git clone <repository-url>
    cd mannaiah
    ```

2.  **Install dependencies**:
    ```bash
    npm install
    ```

## Configuration

1.  **Environment Variables**:
    Copy the example environment file to create your local `.env` file:
    ```bash
    cp .env.example .env
    ```

2.  **Update `.env`**:
    Open `.env` and configure the following required variables:

    -   `MANNAIAH_MONGO_URI`: Your MongoDB connection string (default: `mongodb://localhost:27017/mannaiah`).
    -   `LOGTO_ISSUER`: Your Logto tenant URL.
    -   `LOGTO_AUDIENCE`: Your Logto API audience.

    *Optional for development:*
    -   WooCommerce settings can be left as placeholders if not testing sync features.

## Running the Application

-   **Development Mode**:
    To start the application in development mode with watch enabled:
    ```bash
    npm run start:dev
    ```
    *Note: Do not use `npm run dev` as it is not defined.*

-   **Production Mode**:
    To build and run for production:
    ```bash
    npm run build
    npm run start:prod
    ```

## Testing

-   **Unit Tests**:
    ```bash
    npm run test
    ```

-   **E2E Tests**:
    ```bash
    npm run test:e2e
    ```
