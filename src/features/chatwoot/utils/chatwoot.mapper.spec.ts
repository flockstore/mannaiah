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
                custom_attributes: {
                    documentType: undefined,
                    documentNumber: undefined,
                    cityCode: undefined,
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

        it('should prepend +57 even if number starts with 57 but lacks +', () => {
            // As per current simple logic: "doesn't start with +" -> add default code +57
            const contact = {
                email: 'test@example.com',
                phone: '573001234567',
            } as ContactDocument

            const payload = ChatwootMapper.toChatwootPayload(contact)
            // Result is +57573001234567
            expect(payload.phone_number).toBe('+57573001234567')
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
