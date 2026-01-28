import { ChatwootMapper } from './chatwoot.mapper'
import { ContactDocument } from '../../contacts/interfaces/contact.interface'

describe('ChatwootMapper', () => {
    describe('toChatwootPayload', () => {
        it('should map basic contact correctly', () => {
            const contact = {
                email: 'test@example.com',
                firstName: 'John',
                lastName: 'Doe',
            } as ContactDocument

            const payload = ChatwootMapper.toChatwootPayload(contact)

            expect(payload).toEqual({
                name: 'John Doe',
                email: 'test@example.com',
                phone_number: undefined,
                additional_attributes: {
                    city: undefined,
                    country_code: 'CO',
                },
                custom_attributes: {
                    documentType: undefined,
                    documentNumber: undefined,
                },
            })
        })

        it('should validate and pass E.164 phone numbers', () => {
            const contact = {
                email: 'test@example.com',
                phone: '+1234567890',
            } as ContactDocument

            const payload = ChatwootMapper.toChatwootPayload(contact)
            expect(payload.phone_number).toBe('+1234567890')
        })

        it('should prepend +57 default country code to local numbers', () => {
            const contact = {
                email: 'test@example.com',
                phone: '300 676 9994',
            } as ContactDocument

            const payload = ChatwootMapper.toChatwootPayload(contact)
            expect(payload.phone_number).toBe('+573006769994')
        })

        it('should prepend + prefix if number starts with country code but missing plus', () => {
            const contact = {
                email: 'test@example.com',
                phone: '573001234567',
            } as ContactDocument

            const payload = ChatwootMapper.toChatwootPayload(contact)
            // Logic: starts with 57... -> just prepend + -> +57300... 
            // Fixes the double 57 issue
            expect(payload.phone_number).toBe('+573001234567')
        })

        it('should sanitize phone numbers with spaces/dashes if they are otherwise valid E164', () => {
            const contact = {
                email: 'test@example.com',
                phone: '+1 234-567-890',
            } as ContactDocument

            const payload = ChatwootMapper.toChatwootPayload(contact)
            expect(payload.phone_number).toBe('+1234567890')
        })
    })
})
