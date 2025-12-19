# WooCommerce Module

The `WooCommerceModule` handles integration with a WooCommerce store to synchronize data.

## Features

-   **Order Sync**: Fetches orders from WooCommerce and creates/updates local Contacts based on customer data.
-   **Cron Job**: A scheduled task runs periodically (configurable via `WOOCOMMERCE_SYNC_CRON`) to pull new orders.

## Configuration

Required environment variables:
-   `WOOCOMMERCE_URL`: Base URL of the store.
-   `WOOCOMMERCE_CONSUMER_KEY`: API Consumer Key.
-   `WOOCOMMERCE_CONSUMER_SECRET`: API Consumer Secret.
-   `WOOCOMMERCE_SYNC_CONTACTS`: Set to `true` to enable synchronization.
-   `WOOCOMMERCE_SYNC_CRON`: Cron expression for sync schedule (default: `0 0 * * *` - daily at midnight).

## Architecture

-   **`WooCommerceService`**: Wrapper around the WooCommerce REST API client.
-   **`WooCommerceSyncService`**: Logic for fetching orders and mapping them to Contact entities.
-   **`WooCommerceCron`**: Handles the scheduling of sync tasks.
