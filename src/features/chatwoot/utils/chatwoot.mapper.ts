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
      phone_number: contact.phone,
      custom_attributes: {
        documentType: contact.documentType,
        documentNumber: contact.documentNumber,
        cityCode: contact.cityCode,
      },
    }
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
