import { Injectable, Logger } from '@nestjs/common'
import WooCommerceRestApi from '@woocommerce/woocommerce-rest-api'
import { Observable, from, throwError, forkJoin, of } from 'rxjs'
import { catchError, map, expand, reduce, filter } from 'rxjs/operators'
import { WooCommerceConfigService } from '../config/woocommerce-config.service'

/**
 * WooCommerce order data from REST API
 */
export interface WooCommerceOrder {
    id: number
    billing: {
        first_name: string
        last_name: string
        address_1: string
        address_2: string
        city: string
        state: string
        phone: string
        email: string
    }
    meta_data: Array<{
        id: number
        key: string
        value: string
    }>
    [key: string]: any
}

/**
 * Service for interacting with WooCommerce REST API
 */
@Injectable()
export class WooCommerceApiService {
    private readonly logger = new Logger(WooCommerceApiService.name)
    private api: WooCommerceRestApi | null = null

    constructor(private readonly config: WooCommerceConfigService) {
        this.initializeApi()
    }

    /**
     * Initialize the WooCommerce API client if configured
     */
    private initializeApi(): void {
        if (!this.config.isConfigured()) {
            return
        }

        try {
            this.api = new WooCommerceRestApi({
                url: this.config.url!,
                consumerKey: this.config.consumerKey!,
                consumerSecret: this.config.consumerSecret!,
                version: 'wc/v3',
            })
            this.logger.log('WooCommerce API client initialized')
        } catch (error) {
            this.logger.error(
                'Failed to initialize WooCommerce API client',
                error instanceof Error ? error.stack : String(error),
            )
            this.api = null
        }
    }

    /**
     * Validate the WooCommerce API connection
     * @returns Observable that emits true if connection is valid, false otherwise
     */
    validateConnection(): Observable<boolean> {
        if (!this.api) {
            this.logger.warn(
                'Cannot validate connection: WooCommerce API not initialized',
            )
            return of(false)
        }

        return from(this.api.get('system_status')).pipe(
            map(() => {
                this.logger.log('WooCommerce connection validated successfully')
                return true
            }),
            catchError((error) => {
                this.logger.error(
                    'WooCommerce connection validation failed',
                    error instanceof Error ? error.message : String(error),
                )
                return of(false)
            }),
        )
    }

    /**
     * Get a single page of orders from WooCommerce
     * @param page - Page number (1-indexed)
     * @param perPage - Number of orders per page
     * @returns Observable emitting array of orders
     */
    private getOrdersPage(
        page: number,
        perPage: number = 100,
    ): Observable<{ data: WooCommerceOrder[]; hasMore: boolean }> {
        if (!this.api) {
            return throwError(
                () => new Error('WooCommerce API not initialized'),
            )
        }

        return from(
            this.api.get('orders', {
                page,
                per_page: perPage,
            }),
        ).pipe(
            map((response: any) => {
                const data = response.data as WooCommerceOrder[]
                const totalPages = parseInt(response.headers['x-wp-totalpages'] || '1')
                return {
                    data,
                    hasMore: page < totalPages,
                }
            }),
            catchError((error) => {
                this.logger.error(
                    `Failed to fetch orders page ${page}`,
                    error instanceof Error ? error.stack : String(error),
                )
                return throwError(() => error)
            }),
        )
    }

    /**
     * Get all orders from WooCommerce with automatic pagination
     * @param perPage - Number of orders per page (default: 100)
     * @returns Observable emitting all orders
     */
    private getAllOrders(perPage: number = 100): Observable<WooCommerceOrder[]> {
        if (!this.api) {
            this.logger.warn('Cannot fetch orders: WooCommerce API not initialized')
            return of([])
        }

        this.logger.log('Fetching all orders from WooCommerce...')

        return this.getOrdersPage(1, perPage).pipe(
            expand((result) =>
                result.hasMore
                    ? this.getOrdersPage(
                        Math.floor(result.data.length / perPage) + 2,
                        perPage,
                    )
                    : of(),
            ),
            reduce(
                (acc, result) => [...acc, ...result.data],
                [] as WooCommerceOrder[],
            ),
            map((orders) => {
                this.logger.log(`Fetched ${orders.length} orders from WooCommerce`)
                return orders
            }),
            catchError((error) => {
                this.logger.error(
                    'Failed to fetch all orders',
                    error instanceof Error ? error.stack : String(error),
                )
                return of([])
            }),
        )
    }

    /**
     * Get orders from WooCommerce
     * If page is provided, fetches that specific page.
     * If page is NOT provided, fetches ALL orders using automatic pagination.
     * @param page - Optional page number (1-indexed)
     * @param perPage - Number of orders per page (default: 100)
     * @returns Observable emitting array of orders
     */
    getOrders(
        page?: number,
        perPage: number = 100,
    ): Observable<WooCommerceOrder[]> {
        if (page !== undefined) {
            return this.getOrdersPage(page, perPage).pipe(map((result) => result.data))
        }

        return this.getAllOrders(perPage)
    }

    /**
     * Helper to stream pages with state
     */
    private streamPages(page: number, perPage: number): Observable<{ data: WooCommerceOrder[], page: number, hasMore: boolean }> {
        return this.getOrdersPage(page, perPage).pipe(
            map(result => ({ ...result, page }))
        );
    }

    /**
     * Get a stream of all orders from WooCommerce
     * Emits pages of orders as they are fetched
     * @param perPage - Number of orders per page (default: 100)
     * @returns Observable emitting arrays of orders (one array per page)
     */
    public getOrdersStream(perPage: number = 100): Observable<WooCommerceOrder[]> {
        if (!this.api) {
            this.logger.warn('Cannot fetch orders: WooCommerce API not initialized')
            return of([])
        }

        this.logger.log('Starting order stream from WooCommerce...')

        return this.streamPages(1, perPage).pipe(
            expand(result => result.hasMore ? this.streamPages(result.page + 1, perPage) : of()),
            map(result => result.data),
            // Filter out empty pages if any
            filter(orders => orders.length > 0)
        )
    }
}
