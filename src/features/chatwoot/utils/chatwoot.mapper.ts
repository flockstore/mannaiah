import { ContactDocument } from '../../contacts/interfaces/contact.interface'

export interface ChatwootContactPayload {
  name: string
  email: string
  phone_number?: string
  additional_attributes?: {
    city?: string
    country_code?: string
    [key: string]: any
  }
  custom_attributes: {
    documentType?: string
    documentNumber?: string
    [key: string]: any
  }
}

export class ChatwootMapper {
  static toChatwootPayload(contact: ContactDocument): ChatwootContactPayload {
    const name = ChatwootMapper.resolveName(contact)

    return {
      name,
      email: contact.email,
      phone_number: ChatwootMapper.validatePhone(contact.phone),
      additional_attributes: {
        city: contact.cityCode, // Is cityCode a code or name? Assuming name/code string for now.
        country_code: 'CO', // Defaulting to Colombia
      },
      custom_attributes: {
        documentType: contact.documentType,
        documentNumber: contact.documentNumber,
      },
    }
  }

  private static validatePhone(phone?: string): string | undefined {
    if (!phone) return undefined

    const DEFAULT_COUNTRY_CODE = '57' // No plus here for easier checking

    // Remove all non-digit and non-plus characters
    let sanitized = phone.replace(/[^\d+]/g, '')

    // If empty after sanitization, return undefined
    if (!sanitized) return undefined

    // 1. Check if it already has a plus
    if (sanitized.startsWith('+')) {
      // E.164 check: + followed by 1-15 digits
      if (/^\+[1-9]\d{1,14}$/.test(sanitized)) {
        return sanitized
      }
      return undefined
    }

    // 2. If no plus, check if it starts with the default country code
    if (sanitized.startsWith(DEFAULT_COUNTRY_CODE)) {
      // e.g. 573001234567 -> just add + -> +573001234567
      sanitized = `+${sanitized}`
    } else {
      // e.g. 3001234567 -> add +57 -> +573001234567
      sanitized = `+${DEFAULT_COUNTRY_CODE}${sanitized}`
    }

    // 3. Final validation
    if (/^\+[1-9]\d{1,14}$/.test(sanitized)) {
      return sanitized
    }

    return undefined
  }

  private static resolveName(contact: ContactDocument): string {
    if (contact.legalName) {
      return contact.legalName
    }

    if (contact.firstName || contact.lastName) {
      return [contact.firstName, contact.lastName].filter(Boolean).join(' ')
    }

    // Fallback if no name is present (though validation should prevent this)
    return contact.email.split('@')[0]
  }
}
