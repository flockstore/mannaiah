import { Injectable, Logger } from '@nestjs/common'
import { Observable, of, from } from 'rxjs'
import { map, switchMap, catchError, concatMap, reduce } from 'rxjs/operators'
import { ContactService } from '../services/contact.service'
import { ContactUpdate, ContactDocument } from '../interfaces/contact.interface'
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
  ) {}

  /**
   * Check if error is a MongoDB duplicate key error
   * @param error - Error object
   * @returns True if error is E11000 duplicate key error
   */
  private isDuplicateKeyError(error: any): boolean {
    return Boolean(
      (error as { code: number })?.code === 11000 ||
      (error as { message: string })?.message?.includes('E11000') ||
      (error as { message: string })?.message?.includes('duplicate key'),
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
    const handleContact = (
      existingContact: ContactDocument | null,
    ): Observable<void> => {
      if (existingContact) {
        // Contact exists, check if update is needed
        if (
          WooCommerceMappingUtil.hasContactChanged(existingContact, contactData)
        ) {
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
            .updateContact(String(existingContact._id), updateData)
            .pipe(
              map(() => {
                stats.updated++
              }),
              catchError((error: any) => {
                stats.errors++
                stats.errorDetails.push(
                  `Order ${order.id}: Update failed - ${(error as Error).message}`,
                )
                this.logger.error(
                  `Failed to update contact for order ${order.id}`,

                  (error as Error).message,
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
          catchError((error: any) => {
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
                            String(existingContact._id),
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
                  catchError((retryError: any) => {
                    stats.errors++
                    stats.errorDetails.push(
                      `Order ${order.id}: Retry failed - ${(retryError as Error).message}`,
                    )
                    this.logger.error(
                      `Failed to retry contact for order ${order.id}`,

                      (retryError as Error).message,
                    )
                    return of(undefined)
                  }),
                )
            }

            // For non-duplicate errors, log and continue
            stats.errors++
            stats.errorDetails.push(
              `Order ${order.id}: Creation failed - ${(error as Error).message}`,
            )
            this.logger.error(
              `Failed to create contact for order ${order.id}`,

              (error as Error).message,
            )
            return of(undefined)
          }),
        )
      }
    }

    // Use email lookup via findAllPaginated
    return this.contactService
      .findAllPaginated({ email: contactData.email }, 1, 1)
      .pipe(
        map((result) => result.data[0] || null),
        switchMap((existingContact) => handleContact(existingContact)),
        catchError((error: any) => {
          stats.errors++
          stats.errorDetails.push(
            `Order ${order.id}: Lookup failed - ${(error as Error).message}`,
          )
          this.logger.error(
            `Failed to process order ${order.id}`,

            (error as Error).message,
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

    // Keep track of processed emails to prevent duplicates within this sync run
    const seenEmails = new Set<string>()

    return this.wooCommerceApi.getOrdersStream().pipe(
      // Process each page of orders sequentially
      concatMap((orders) => {
        this.logger.log(`Processing page with ${orders.length} orders...`)
        stats.total += orders.length

        // Process orders within the page
        // We use concatMap to process them one by one to avoid race conditions
        // and keep memory usage low
        return from(orders).pipe(
          concatMap((order: WooCommerceOrder) => {
            const email = order.billing?.email?.toLowerCase()

            if (!email) {
              stats.errors++
              stats.errorDetails.push(
                `Order ${order.id}: Missing email, skipping`,
              )
              this.logger.warn(`Order ${order.id} missing email, skipping`)
              return of(undefined)
            }

            if (seenEmails.has(email)) {
              // We have already processed this email in this run
              return of(undefined)
            }

            seenEmails.add(email)
            return this.processOrder(order, stats)
          }),
        )
      }),
      // Wait for all processing to complete and return the stats object
      reduce(() => stats, stats),
      map(() => {
        this.logger.log(
          `Sync completed: ${stats.created} created, ${stats.updated} updated, ${stats.unchanged} unchanged, ${stats.errors} errors`,
        )
        return stats
      }),
      catchError((error: unknown) => {
        this.logger.error(
          'Fatal error during customer sync',
          error instanceof Error ? error.stack : String(error),
        )
        stats.errors++
        stats.errorDetails.push(`Fatal error: ${(error as Error).message}`)
        return of(stats)
      }),
    )
  }
}
