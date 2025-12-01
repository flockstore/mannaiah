import { Injectable, Logger } from '@nestjs/common'
import { Observable, of, forkJoin } from 'rxjs'
import { map, switchMap, catchError } from 'rxjs/operators'
import { ContactService } from '../services/contact.service'
import {
    ContactCreate,
    ContactUpdate,
} from '../interfaces/contact.interface'
import {
    WooCommerceApiService,
    WooCommerceOrder,
} from '../../woocommerce/services/woocommerce-api.service'
import { SyncStatistics } from './interfaces/sync-statistics.interface'
import { WooCommerceMappingUtil } from '../utils/woocommerce-mapping.util'

/**
 * Service for syncing WooCommerce customers to contacts
 */
@Injectable()
export class WooCommerceSyncService {
    private readonly logger = new Logger(WooCommerceSyncService.name)

    constructor(
        private readonly wooCommerceApi: WooCommerceApiService,
        private readonly contactService: ContactService,
    ) { }

    /**
     * Process a single order and sync to contacts
     * @param order - WooCommerce order
     * @param stats - Sync statistics to update
     * @returns Observable that completes when processing is done
     */
    private processOrder(
        order: WooCommerceOrder,
        stats: SyncStatistics,
    ): Observable<void> {
        const contactData = WooCommerceMappingUtil.mapOrderToContact(order)

        if (!contactData) {
            stats.errors++
            stats.errorDetails.push(`Order ${order.id}: Invalid or missing data`)
            return of(undefined)
        }

        // Check if contact already exists
        return this.contactService
            .findByDocument(contactData.documentType, contactData.documentNumber)
            .pipe(
                switchMap((existingContact) => {
                    if (existingContact) {
                        // Contact exists, check if update is needed
                        if (WooCommerceMappingUtil.hasContactChanged(existingContact, contactData)) {
                            const updateData: ContactUpdate = {
                                firstName: contactData.firstName,
                                lastName: contactData.lastName,
                                email: contactData.email,
                                phone: contactData.phone,
                                address: contactData.address,
                                addressExtra: contactData.addressExtra,
                                cityCode: contactData.cityCode,
                            }

                            return this.contactService
                                .updateContact(existingContact._id.toString(), updateData)
                                .pipe(
                                    map(() => {
                                        stats.updated++
                                    }),
                                    catchError((error) => {
                                        stats.errors++
                                        stats.errorDetails.push(
                                            `Order ${order.id}: Update failed - ${error.message}`,
                                        )
                                        this.logger.error(
                                            `Failed to update contact for order ${order.id}`,
                                            error.message,
                                        )
                                        return of(undefined)
                                    }),
                                )
                        } else {
                            stats.unchanged++
                            return of(undefined)
                        }
                    } else {
                        // Contact doesn't exist, create new
                        return this.contactService.createContact(contactData).pipe(
                            map(() => {
                                stats.created++
                            }),
                            catchError((error) => {
                                stats.errors++
                                stats.errorDetails.push(
                                    `Order ${order.id}: Creation failed - ${error.message}`,
                                )
                                this.logger.error(
                                    `Failed to create contact for order ${order.id}`,
                                    error.message,
                                )
                                return of(undefined)
                            }),
                        )
                    }
                }),
                catchError((error) => {
                    stats.errors++
                    stats.errorDetails.push(
                        `Order ${order.id}: Lookup failed - ${error.message}`,
                    )
                    this.logger.error(
                        `Failed to process order ${order.id}`,
                        error.message,
                    )
                    return of(undefined)
                }),
            )
    }

    /**
     * Sync all customers from WooCommerce to contacts
     * @returns Observable emitting sync statistics
     */
    syncCustomers(): Observable<SyncStatistics> {
        this.logger.log('Starting WooCommerce customer sync...')

        const stats: SyncStatistics = {
            total: 0,
            created: 0,
            updated: 0,
            unchanged: 0,
            errors: 0,
            errorDetails: [],
        }

        return this.wooCommerceApi.getOrders().pipe(
            switchMap((orders) => {
                stats.total = orders.length
                this.logger.log(`Processing ${orders.length} orders...`)

                if (orders.length === 0) {
                    return of(stats)
                }

                // Process all orders
                const processes = orders.map((order) =>
                    this.processOrder(order, stats),
                )

                return forkJoin(processes).pipe(map(() => stats))
            }),
            map((finalStats) => {
                this.logger.log(
                    `Sync completed: ${finalStats.created} created, ${finalStats.updated} updated, ${finalStats.unchanged} unchanged, ${finalStats.errors} errors`,
                )
                return finalStats
            }),
            catchError((error) => {
                this.logger.error(
                    'Fatal error during customer sync',
                    error instanceof Error ? error.stack : String(error),
                )
                stats.errors++
                stats.errorDetails.push(`Fatal error: ${error.message}`)
                return of(stats)
            }),
        )
    }
}
