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
     * Check if error is a MongoDB duplicate key error
     * @param error - Error object
     * @returns True if error is E11000 duplicate key error
     */
    private isDuplicateKeyError(error: any): boolean {
        return (
            error?.code === 11000 ||
            error?.message?.includes('E11000') ||
            error?.message?.includes('duplicate key')
        )
    }



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

        // Helper to handle update or create
        const handleContact = (existingContact: any | null): Observable<void> => {
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
                        // Update document info if it was missing and now provided
                        documentType: contactData.documentType,
                        documentNumber: contactData.documentNumber,
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
                        // Check if this is a duplicate key error (race condition)
                        if (this.isDuplicateKeyError(error)) {
                            this.logger.debug(
                                `Duplicate key error for order ${order.id}, retrying as update...`,
                            )
                            // Retry by looking up the contact and updating
                            return this.contactService
                                .findAllPaginated({ email: contactData.email }, 1, 1)
                                .pipe(
                                    switchMap((result) => {
                                        const existingContact = result.data[0]
                                        if (existingContact) {
                                            // Contact was created by concurrent process, update it
                                            if (
                                                WooCommerceMappingUtil.hasContactChanged(
                                                    existingContact,
                                                    contactData,
                                                )
                                            ) {
                                                const updateData: ContactUpdate = {
                                                    firstName: contactData.firstName,
                                                    lastName: contactData.lastName,
                                                    email: contactData.email,
                                                    phone: contactData.phone,
                                                    address: contactData.address,
                                                    addressExtra: contactData.addressExtra,
                                                    cityCode: contactData.cityCode,
                                                    documentType: contactData.documentType,
                                                    documentNumber: contactData.documentNumber,
                                                }
                                                return this.contactService
                                                    .updateContact(
                                                        existingContact._id.toString(),
                                                        updateData,
                                                    )
                                                    .pipe(
                                                        map(() => {
                                                            stats.updated++
                                                        }),
                                                    )
                                            } else {
                                                stats.unchanged++
                                                return of(undefined)
                                            }
                                        } else {
                                            // Contact still doesn't exist, log error
                                            stats.errors++
                                            stats.errorDetails.push(
                                                `Order ${order.id}: Contact not found after duplicate key error`,
                                            )
                                            return of(undefined)
                                        }
                                    }),
                                    catchError((retryError) => {
                                        stats.errors++
                                        stats.errorDetails.push(
                                            `Order ${order.id}: Retry failed - ${retryError.message}`,
                                        )
                                        this.logger.error(
                                            `Failed to retry contact for order ${order.id}`,
                                            retryError.message,
                                        )
                                        return of(undefined)
                                    }),
                                )
                        }

                        // For non-duplicate errors, log and continue
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
        }

        // Use email lookup via findAllPaginated
        return this.contactService.findAllPaginated({ email: contactData.email }, 1, 1).pipe(
            map(result => result.data[0] || null),
            switchMap(existingContact => handleContact(existingContact)),
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

                // Group orders by email to prevent race conditions
                const groupedByEmail = new Map<string, WooCommerceOrder[]>()

                for (const order of orders) {
                    const email = order.billing?.email?.toLowerCase()
                    if (email) {
                        if (!groupedByEmail.has(email)) {
                            groupedByEmail.set(email, [])
                        }
                        groupedByEmail.get(email)!.push(order)
                    } else {
                        // Handle missing email immediately
                        stats.errors++
                        stats.errorDetails.push(`Order ${order.id}: Missing email, skipping`)
                        this.logger.warn(`Order ${order.id} missing email, skipping`)
                    }
                }

                this.logger.debug(
                    `Grouped ${orders.length} orders into ${groupedByEmail.size} unique emails`,
                )

                // For each unique email, process only the first order
                // (subsequent orders with same email will be handled by update logic)
                const uniqueOrders: WooCommerceOrder[] = []
                groupedByEmail.forEach((orderGroup) => {
                    // Take the first order for each email
                    uniqueOrders.push(orderGroup[0])
                })

                // If no valid orders to process but we had errors, return stats
                if (uniqueOrders.length === 0) {
                    return of(stats)
                }

                // Process all unique email orders
                const processes = uniqueOrders.map((order) =>
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
