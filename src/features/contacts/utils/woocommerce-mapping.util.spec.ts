import { WooCommerceMappingUtil } from './woocommerce-mapping.util'
import { DocumentType } from '../interfaces/contact.interface'

describe('WooCommerceMappingUtil', () => {
    const mockOrder = {
        id: 1,
        billing: {
            first_name: 'John',
            last_name: 'Doe',
            address_1: '123 Main St',
            address_2: 'Apt 4',
            city: 'Bogotá',
            state: 'Cundinamarca',
            phone: '3001234567',
            email: 'john@example.com',
        },
        meta_data: [
            {
                id: 1,
                key: '_billing_document',
                value: '123456789',
            },
        ],
    }

    describe('extractDocumentNumber', () => {
        it('should extract document number from metadata', () => {
            const docNumber = WooCommerceMappingUtil.extractDocumentNumber(mockOrder)
            expect(docNumber).toBe('123456789')
        })

        it('should return undefined if metadata is missing', () => {
            const order = { ...mockOrder, meta_data: [] }
            const docNumber = WooCommerceMappingUtil.extractDocumentNumber(order)
            expect(docNumber).toBeUndefined()
        })
    })

    describe('mapOrderToContact', () => {
        it('should map valid order to ContactCreate DTO', () => {
            const contact = WooCommerceMappingUtil.mapOrderToContact(mockOrder)
            expect(contact).toEqual({
                documentType: DocumentType.CC,
                documentNumber: '123456789',
                firstName: 'John',
                lastName: 'Doe',
                email: 'john@example.com',
                phone: '+573001234567',
                address: '123 Main St',
                addressExtra: 'Apt 4',
                cityCode: 'Bogotá',
            })
        })

        it('should return null if email is missing', () => {
            const order = { ...mockOrder, billing: { ...mockOrder.billing, email: '' } }
            const contact = WooCommerceMappingUtil.mapOrderToContact(order)
            expect(contact).toBeNull()
        })

        it('should create contact without document fields if document number is missing', () => {
            const order = { ...mockOrder, meta_data: [] }
            const contact = WooCommerceMappingUtil.mapOrderToContact(order)
            expect(contact).not.toBeNull()
            expect(contact?.documentType).toBeUndefined()
            expect(contact?.documentNumber).toBeUndefined()
            expect(contact?.email).toBe('john@example.com')
        })

        it('should return null if names are missing', () => {
            const order = { ...mockOrder, billing: { ...mockOrder.billing, first_name: '' } }
            const contact = WooCommerceMappingUtil.mapOrderToContact(order)
            expect(contact).toBeNull()
        })
    })

    describe('hasContactChanged', () => {
        const existingContact = {
            firstName: 'John',
            lastName: 'Doe',
            email: 'john@example.com',
            phone: '+573001234567',
            address: '123 Main St',
            addressExtra: 'Apt 4',
            cityCode: 'Bogotá',
        }

        const newContact = {
            documentType: DocumentType.CC,
            documentNumber: '123456789',
            firstName: 'John',
            lastName: 'Doe',
            email: 'john@example.com',
            phone: '+573001234567',
            address: '123 Main St',
            addressExtra: 'Apt 4',
            cityCode: 'Bogotá',
        }

        it('should return false if data is identical', () => {
            const changed = WooCommerceMappingUtil.hasContactChanged(existingContact, newContact)
            expect(changed).toBe(false)
        })

        it('should return true if data has changed', () => {
            const changedContact = { ...newContact, firstName: 'Jane' }
            const changed = WooCommerceMappingUtil.hasContactChanged(existingContact, changedContact)
            expect(changed).toBe(true)
        })
    })
})
