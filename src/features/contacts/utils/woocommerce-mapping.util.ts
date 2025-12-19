import { Logger } from '@nestjs/common'
import {
  ContactCreate,
  DocumentType,
  ContactDocument,
} from '../interfaces/contact.interface'
// import { ContactDocument } from '../schemas/contact.schema'
import { WooCommerceOrder } from '../../woocommerce/services/woocommerce-api.service'
import { PhoneUtil } from './phone.util'

/**
 * Utility functions for mapping WooCommerce data to Contacts
 */
export class WooCommerceMappingUtil {
  private static readonly logger = new Logger(WooCommerceMappingUtil.name)

  /**
   * Extract document number from order metadata
   * @param order - WooCommerce order
   * @returns Document number or undefined if not found
   */
  static extractDocumentNumber(order: WooCommerceOrder): string | undefined {
    const meta = order.meta_data?.find((m) => m.key === '_billing_document')
    return meta?.value
  }

  /**
   * Map WooCommerce order to ContactCreate DTO
   * @param order - WooCommerce order
   * @returns ContactCreate DTO or null if data is invalid
   */
  static mapOrderToContact(order: WooCommerceOrder): ContactCreate | null {
    try {
      const { billing } = order
      const documentNumber = this.extractDocumentNumber(order)

      if (!billing.email) {
        this.logger.warn(`Order ${order.id} missing email, skipping`)
        return null
      }

      if (!billing.first_name || !billing.last_name) {
        this.logger.warn(`Order ${order.id} missing name fields, skipping`)
        return null
      }

      const contact: ContactCreate = {
        documentType: documentNumber ? DocumentType.CC : undefined, // Default to CC if number exists, else undefined
        documentNumber: documentNumber || undefined,
        firstName: billing.first_name,
        lastName: billing.last_name,
        email: billing.email.toLowerCase(),
        phone: billing.phone ? PhoneUtil.format(billing.phone) : undefined,
        address: billing.address_1 || undefined,
        addressExtra: billing.address_2 || undefined,
        cityCode: billing.city || undefined,
      }

      return contact
    } catch (error) {
      this.logger.error(
        `Error mapping order ${order.id}`,
        error instanceof Error ? error.message : String(error),
      )
      return null
    }
  }

  /**
   * Check if contact data has changed
   * @param existing - Existing contact
   * @param newData - New contact data
   * @returns True if data has changed
   */
  static hasContactChanged(
    existing: ContactDocument,
    newData: ContactCreate,
  ): boolean {
    return (
      existing.firstName !== newData.firstName ||
      existing.lastName !== newData.lastName ||
      existing.email !== newData.email ||
      existing.phone !== newData.phone ||
      existing.address !== newData.address ||
      existing.addressExtra !== newData.addressExtra ||
      existing.cityCode !== newData.cityCode
    )
  }
}
