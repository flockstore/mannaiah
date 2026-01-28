import { ContactDocument } from '../../contacts/interfaces/contact.interface'

export interface ChatwootContactPayload {
  name: string
  email: string
  phone_number?: string
  custom_attributes: {
    documentType?: string
    documentNumber?: string
    cityCode?: string
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
      custom_attributes: {
        documentType: contact.documentType,
        documentNumber: contact.documentNumber,
        cityCode: contact.cityCode,
      },
    }
  }

  private static validatePhone(phone?: string): string | undefined {
    if (!phone) return undefined

    const DEFAULT_COUNTRY_CODE = '+57'

    // Remove all non-digit and non-plus characters
    let sanitized = phone.replace(/[^\d+]/g, '')

    // If empty after sanitization, return undefined
    if (!sanitized) return undefined

    // If it starts with +, check if it's E.164 valid
    if (sanitized.startsWith('+')) {
      // Basic E.164 check: + followed by 1-15 digits
      if (/^\+[1-9]\d{1,14}$/.test(sanitized)) {
        return sanitized
      }
      // If starts with + but invalid (e.g. + without digits or too long), 
      // we might want to strip + and try adding default, or just fail. 
      // For now, if provided with + country code, assume user meant that.
      return undefined
    }

    // If no +, assume local number and prepend default country code
    // Check if it looks like a valid number length (e.g. 10 digits for Colombia mobile)
    // To be safe for general inputs, we just prepend and validate
    sanitized = `${DEFAULT_COUNTRY_CODE}${sanitized}`

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
