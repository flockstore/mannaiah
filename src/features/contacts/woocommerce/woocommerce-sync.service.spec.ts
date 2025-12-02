import { Test, TestingModule } from '@nestjs/testing'
import { WooCommerceSyncService } from './woocommerce-sync.service'
import { ContactService } from '../services/contact.service'
import { WooCommerceApiService } from '../../woocommerce/services/woocommerce-api.service'
import { of, throwError } from 'rxjs'
import { DocumentType } from '../interfaces/contact.interface'

describe('WooCommerceSyncService', () => {
    let service: WooCommerceSyncService
    let contactService: jest.Mocked<ContactService>
    let wooCommerceApi: jest.Mocked<WooCommerceApiService>

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

    const mockContact = {
        _id: 'contact-id-123',
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

    beforeEach(async () => {
        const mockContactService = {
            createContact: jest.fn(),
            updateContact: jest.fn(),
            findAllPaginated: jest.fn(),
        }

        const mockWooCommerceApi = {
            getOrders: jest.fn(),
        }

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                WooCommerceSyncService,
                {
                    provide: ContactService,
                    useValue: mockContactService,
                },
                {
                    provide: WooCommerceApiService,
                    useValue: mockWooCommerceApi,
                },
            ],
        }).compile()

        service = module.get<WooCommerceSyncService>(WooCommerceSyncService)
        contactService = module.get(ContactService)
        wooCommerceApi = module.get(WooCommerceApiService)
    })

    afterEach(() => {
        jest.clearAllMocks()
    })

    it('should be defined', () => {
        expect(service).toBeDefined()
    })

    describe('processOrder (private)', () => {
        // We test this via syncCustomers since it's private,
        // or we could cast to any to test directly if needed.
    })

    describe('syncCustomers', () => {
        it('should process orders and create new contacts', (done) => {
            const orders = [mockOrder]
            wooCommerceApi.getOrders.mockReturnValue(of(orders))
            // Mock findAllPaginated to return empty list (not found by email)
            contactService.findAllPaginated.mockReturnValue(of({ data: [], total: 0, page: 1, limit: 1 }))
            contactService.createContact.mockReturnValue(of({ _id: 'new-id' } as any))

            service.syncCustomers().subscribe({
                next: (stats) => {
                    expect(stats.created).toBe(1)
                    expect(stats.updated).toBe(0)
                    expect(stats.errors).toBe(0)
                    expect(contactService.createContact).toHaveBeenCalled()
                    done()
                },
            })
        })

        it('should update existing contacts if changed', (done) => {
            const orders = [mockOrder]
            const existingContact = {
                ...mockContact,
                _id: 'existing-id',
                firstName: 'Old Name', // Different name
            }

            wooCommerceApi.getOrders.mockReturnValue(of(orders))
            contactService.findAllPaginated.mockReturnValue(of({ data: [existingContact as any], total: 1, page: 1, limit: 1 }))
            contactService.updateContact.mockReturnValue(of({ ...existingContact, firstName: 'John' } as any))

            service.syncCustomers().subscribe({
                next: (stats) => {
                    expect(stats.updated).toBe(1)
                    expect(stats.created).toBe(0)
                    expect(stats.errors).toBe(0)
                    expect(contactService.updateContact).toHaveBeenCalled()
                    done()
                },
            })
        })

        it('should not update if contact is unchanged', (done) => {
            const orders = [mockOrder]
            const existingContact = {
                ...mockContact,
                _id: 'existing-id',
            }

            wooCommerceApi.getOrders.mockReturnValue(of(orders))
            contactService.findAllPaginated.mockReturnValue(of({ data: [existingContact as any], total: 1, page: 1, limit: 1 }))

            service.syncCustomers().subscribe({
                next: (stats) => {
                    expect(stats.unchanged).toBe(1)
                    expect(stats.updated).toBe(0)
                    expect(stats.created).toBe(0)
                    expect(contactService.updateContact).not.toHaveBeenCalled()
                    done()
                },
            })
        })

        it('should handle errors gracefully', (done) => {
            const orders = [mockOrder]
            wooCommerceApi.getOrders.mockReturnValue(of(orders))
            contactService.findAllPaginated.mockReturnValue(throwError(() => new Error('DB Error')))

            service.syncCustomers().subscribe({
                next: (stats) => {
                    expect(stats.errors).toBe(1)
                    expect(stats.errorDetails[0]).toContain('Lookup failed')
                    done()
                },
            })
        })
    })

    describe('phone formatting', () => {
        it('should format phone with +57 prefix', (done) => {
            const orderWithPhone = {
                ...mockOrder,
                billing: { ...mockOrder.billing, phone: '3001234567' },
            }

            wooCommerceApi.getOrders.mockReturnValue(of([orderWithPhone]))
            contactService.findAllPaginated.mockReturnValue(of({ data: [], total: 0, page: 1, limit: 1 }))
            contactService.createContact.mockReturnValue(of(mockContact as any))

            service.syncCustomers().subscribe(() => {
                expect(contactService.createContact).toHaveBeenCalledWith(
                    expect.objectContaining({
                        phone: '+573001234567',
                    }),
                )
                done()
            })
        })

        it('should remove existing +57 before adding it back', (done) => {
            const orderWithPlusPhone = {
                ...mockOrder,
                billing: { ...mockOrder.billing, phone: '+57 300 123 4567' },
            }

            wooCommerceApi.getOrders.mockReturnValue(of([orderWithPlusPhone]))
            contactService.findAllPaginated.mockReturnValue(of({ data: [], total: 0, page: 1, limit: 1 }))
            contactService.createContact.mockReturnValue(of(mockContact as any))

            service.syncCustomers().subscribe(() => {
                expect(contactService.createContact).toHaveBeenCalledWith(
                    expect.objectContaining({
                        phone: '+573001234567',
                    }),
                )
                done()
            })
        })
    })

    describe('data extraction and mapping', () => {
        it('should extract document number from metadata', (done) => {
            wooCommerceApi.getOrders.mockReturnValue(of([mockOrder]))
            contactService.findAllPaginated.mockReturnValue(of({ data: [], total: 0, page: 1, limit: 1 }))
            contactService.createContact.mockReturnValue(of(mockContact as any))

            service.syncCustomers().subscribe(() => {
                expect(contactService.createContact).toHaveBeenCalledWith(
                    expect.objectContaining({
                        documentNumber: '123456789',
                    }),
                )
                done()
            })
        })

        it('should map billing data correctly', (done) => {
            wooCommerceApi.getOrders.mockReturnValue(of([mockOrder]))
            contactService.findAllPaginated.mockReturnValue(of({ data: [], total: 0, page: 1, limit: 1 }))
            contactService.createContact.mockReturnValue(of(mockContact as any))

            service.syncCustomers().subscribe(() => {
                expect(contactService.createContact).toHaveBeenCalledWith({
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
                done()
            })
        })

        it('should create contact even without document number', (done) => {
            const orderWithoutDoc = {
                ...mockOrder,
                meta_data: [],
            }

            wooCommerceApi.getOrders.mockReturnValue(of([orderWithoutDoc]))
            contactService.findAllPaginated.mockReturnValue(of({ data: [], total: 0, page: 1, limit: 1 }))
            contactService.createContact.mockReturnValue(of({ _id: 'new-id' } as any))

            service.syncCustomers().subscribe((stats) => {
                expect(stats.created).toBe(1)
                expect(stats.errors).toBe(0)
                expect(contactService.createContact).toHaveBeenCalledWith(
                    expect.objectContaining({
                        email: 'john@example.com',
                        firstName: 'John',
                        lastName: 'Doe',
                        documentType: undefined,
                        documentNumber: undefined,
                    }),
                )
                done()
            })
        })

        it('should skip order missing email', (done) => {
            const orderWithoutEmail = {
                ...mockOrder,
                billing: { ...mockOrder.billing, email: '' },
            }

            wooCommerceApi.getOrders.mockReturnValue(of([orderWithoutEmail]))

            service.syncCustomers().subscribe((stats) => {
                expect(stats.errors).toBe(1)
                expect(stats.created).toBe(0)
                done()
            })
        })
    })

    describe('contact creation', () => {
        it('should create new contact when not exists', (done) => {
            wooCommerceApi.getOrders.mockReturnValue(of([mockOrder]))
            contactService.findAllPaginated.mockReturnValue(of({ data: [], total: 0, page: 1, limit: 1 }))
            contactService.createContact.mockReturnValue(of(mockContact as any))

            service.syncCustomers().subscribe((stats) => {
                expect(stats.created).toBe(1)
                expect(stats.total).toBe(1)
                expect(contactService.createContact).toHaveBeenCalled()
                done()
            })
        })

        it('should handle creation errors gracefully', (done) => {
            wooCommerceApi.getOrders.mockReturnValue(of([mockOrder]))
            contactService.findAllPaginated.mockReturnValue(of({ data: [], total: 0, page: 1, limit: 1 }))
            contactService.createContact.mockReturnValue(
                throwError(() => new Error('Database error')),
            )

            service.syncCustomers().subscribe((stats) => {
                expect(stats.errors).toBe(1)
                expect(stats.created).toBe(0)
                expect(stats.errorDetails.length).toBeGreaterThan(0)
                done()
            })
        })
    })

    describe('contact update', () => {
        it('should update contact when data has changed', (done) => {
            const existingContact = {
                ...mockContact,
                _id: 'existing-id',
                phone: '+573009999999', // Different phone
            }

            wooCommerceApi.getOrders.mockReturnValue(of([mockOrder]))
            contactService.findAllPaginated.mockReturnValue(of({ data: [existingContact as any], total: 1, page: 1, limit: 1 }))
            contactService.updateContact.mockReturnValue(of(mockContact as any))

            service.syncCustomers().subscribe((stats) => {
                expect(stats.updated).toBe(1)
                expect(stats.unchanged).toBe(0)
                expect(contactService.updateContact).toHaveBeenCalled()
                done()
            })
        })

        it('should not update contact when data is unchanged', (done) => {
            wooCommerceApi.getOrders.mockReturnValue(of([mockOrder]))
            contactService.findAllPaginated.mockReturnValue(of({ data: [mockContact as any], total: 1, page: 1, limit: 1 }))

            service.syncCustomers().subscribe((stats) => {
                expect(stats.unchanged).toBe(1)
                expect(stats.updated).toBe(0)
                expect(contactService.updateContact).not.toHaveBeenCalled()
                done()
            })
        })

        it('should handle update errors gracefully', (done) => {
            const existingContact = {
                ...mockContact,
                _id: 'existing-id',
                phone: '+573009999999',
            }

            wooCommerceApi.getOrders.mockReturnValue(of([mockOrder]))
            contactService.findAllPaginated.mockReturnValue(of({ data: [existingContact as any], total: 1, page: 1, limit: 1 }))
            contactService.updateContact.mockReturnValue(
                throwError(() => new Error('Update failed')),
            )

            service.syncCustomers().subscribe((stats) => {
                expect(stats.errors).toBe(1)
                expect(stats.updated).toBe(0)
                done()
            })
        })
    })

    describe('sync statistics', () => {
        it('should return accurate statistics for mixed operations', (done) => {
            const orders = [
                mockOrder, // Create
                { ...mockOrder, id: 2, billing: { ...mockOrder.billing, email: 'jane@example.com' }, meta_data: [{ id: 2, key: '_billing_document', value: '987654321' }] }, // Create
                { ...mockOrder, id: 3, billing: { ...mockOrder.billing, email: '' } }, // Error
            ]

            wooCommerceApi.getOrders.mockReturnValue(of(orders))
            contactService.findAllPaginated.mockReturnValue(of({ data: [], total: 0, page: 1, limit: 1 }))
            contactService.createContact.mockReturnValue(of(mockContact as any))

            service.syncCustomers().subscribe((stats) => {
                expect(stats.total).toBe(3)
                expect(stats.created).toBe(2)
                expect(stats.errors).toBe(1)
                done()
            })
        })

        it('should handle empty orders list', (done) => {
            wooCommerceApi.getOrders.mockReturnValue(of([]))

            service.syncCustomers().subscribe((stats) => {
                expect(stats.total).toBe(0)
                expect(stats.created).toBe(0)
                done()
            })
        })
    })

    describe('error handling', () => {
        it('should handle fatal errors during sync', (done) => {
            wooCommerceApi.getOrders.mockReturnValue(
                throwError(() => new Error('API failure')),
            )

            service.syncCustomers().subscribe((stats) => {
                expect(stats.errors).toBe(1)
                expect(stats.errorDetails.length).toBeGreaterThan(0)
                done()
            })
        })
    })

    describe('duplicate key error handling', () => {
        it('should handle E11000 duplicate key error and retry as update', (done) => {
            const duplicateError = {
                code: 11000,
                message: 'E11000 duplicate key error collection: mannaiah.contacts index: email_1 dup key: { email: "john@example.com" }',
            }

            wooCommerceApi.getOrders.mockReturnValue(of([mockOrder]))
            // First lookup returns empty (no contact found)
            contactService.findAllPaginated.mockReturnValueOnce(of({ data: [], total: 0, page: 1, limit: 1 }))
            // Create fails with duplicate key error
            contactService.createContact.mockReturnValue(throwError(() => duplicateError))
            // Second lookup (retry) finds the contact that was created concurrently
            contactService.findAllPaginated.mockReturnValueOnce(of({ data: [mockContact as any], total: 1, page: 1, limit: 1 }))

            service.syncCustomers().subscribe((stats) => {
                expect(stats.unchanged).toBe(1)
                expect(stats.errors).toBe(0)
                expect(stats.created).toBe(0)
                expect(contactService.findAllPaginated).toHaveBeenCalledTimes(2)
                done()
            })
        })

        it('should update on duplicate key error if contact data changed', (done) => {
            const duplicateError = {
                code: 11000,
                message: 'E11000 duplicate key error',
            }
            const existingContact = {
                ...mockContact,
                _id: 'existing-id',
                phone: '+573009999999', // Different phone
            }

            wooCommerceApi.getOrders.mockReturnValue(of([mockOrder]))
            contactService.findAllPaginated.mockReturnValueOnce(of({ data: [], total: 0, page: 1, limit: 1 }))
            contactService.createContact.mockReturnValue(throwError(() => duplicateError))
            contactService.findAllPaginated.mockReturnValueOnce(of({ data: [existingContact as any], total: 1, page: 1, limit: 1 }))
            contactService.updateContact.mockReturnValue(of(mockContact as any))

            service.syncCustomers().subscribe((stats) => {
                expect(stats.updated).toBe(1)
                expect(stats.errors).toBe(0)
                expect(contactService.updateContact).toHaveBeenCalled()
                done()
            })
        })

        it('should handle non-duplicate errors normally', (done) => {
            const normalError = new Error('Some other database error')

            wooCommerceApi.getOrders.mockReturnValue(of([mockOrder]))
            contactService.findAllPaginated.mockReturnValue(of({ data: [], total: 0, page: 1, limit: 1 }))
            contactService.createContact.mockReturnValue(throwError(() => normalError))

            service.syncCustomers().subscribe((stats) => {
                expect(stats.errors).toBe(1)
                expect(stats.created).toBe(0)
                expect(stats.errorDetails[0]).toContain('Creation failed')
                done()
            })
        })
    })

    describe('email deduplication', () => {
        it('should deduplicate orders with same email', (done) => {
            const order1 = { ...mockOrder, id: 1 }
            const order2 = { ...mockOrder, id: 2, billing: { ...mockOrder.billing } }
            const order3 = { ...mockOrder, id: 3, billing: { ...mockOrder.billing } }

            wooCommerceApi.getOrders.mockReturnValue(of([order1, order2, order3]))
            contactService.findAllPaginated.mockReturnValue(of({ data: [], total: 0, page: 1, limit: 1 }))
            contactService.createContact.mockReturnValue(of(mockContact as any))

            service.syncCustomers().subscribe((stats) => {
                expect(stats.total).toBe(3)
                expect(stats.created).toBe(1) // Only one contact created for duplicate emails
                expect(contactService.createContact).toHaveBeenCalledTimes(1)
                done()
            })
        })

        it('should process orders with different emails separately', (done) => {
            const order1 = { ...mockOrder, id: 1, billing: { ...mockOrder.billing, email: 'john@example.com' } }
            const order2 = { ...mockOrder, id: 2, billing: { ...mockOrder.billing, email: 'jane@example.com' }, meta_data: [{ id: 2, key: '_billing_document', value: '987654321' }] }

            wooCommerceApi.getOrders.mockReturnValue(of([order1, order2]))
            contactService.findAllPaginated.mockReturnValue(of({ data: [], total: 0, page: 1, limit: 1 }))
            contactService.createContact.mockReturnValue(of(mockContact as any))

            service.syncCustomers().subscribe((stats) => {
                expect(stats.total).toBe(2)
                expect(stats.created).toBe(2)
                expect(contactService.createContact).toHaveBeenCalledTimes(2)
                done()
            })
        })

        it('should handle case-insensitive email deduplication', (done) => {
            const order1 = { ...mockOrder, id: 1, billing: { ...mockOrder.billing, email: 'John@Example.COM' } }
            const order2 = { ...mockOrder, id: 2, billing: { ...mockOrder.billing, email: 'john@example.com' } }

            wooCommerceApi.getOrders.mockReturnValue(of([order1, order2]))
            contactService.findAllPaginated.mockReturnValue(of({ data: [], total: 0, page: 1, limit: 1 }))
            contactService.createContact.mockReturnValue(of(mockContact as any))

            service.syncCustomers().subscribe((stats) => {
                expect(stats.total).toBe(2)
                expect(stats.created).toBe(1) // Should create only once
                expect(contactService.createContact).toHaveBeenCalledTimes(1)
                expect(contactService.createContact).toHaveBeenCalledWith(
                    expect.objectContaining({
                        email: 'john@example.com', // Should be normalized to lowercase
                    }),
                )
                done()
            })
        })

        it('should skip orders without email in deduplication', (done) => {
            const order1 = { ...mockOrder, id: 1, billing: { ...mockOrder.billing, email: 'john@example.com' } }
            const order2 = { ...mockOrder, id: 2, billing: { ...mockOrder.billing, email: '' } }
            const order3 = { ...mockOrder, id: 3, billing: { ...mockOrder.billing, email: 'jane@example.com' }, meta_data: [{ id: 3, key: '_billing_document', value: '987654321' }] }

            wooCommerceApi.getOrders.mockReturnValue(of([order1, order2, order3]))
            contactService.findAllPaginated.mockReturnValue(of({ data: [], total: 0, page: 1, limit: 1 }))
            contactService.createContact.mockReturnValue(of(mockContact as any))

            service.syncCustomers().subscribe((stats) => {
                expect(stats.total).toBe(3)
                expect(stats.created).toBe(2) // Two valid emails
                expect(stats.errors).toBe(1) // One missing email
                done()
            })
        })
    })

    describe('race condition prevention', () => {
        it('should process multiple orders with same email without race condition', (done) => {
            // Simulate multiple orders with same email arriving concurrently
            const orders = [
                { ...mockOrder, id: 1001 },
                { ...mockOrder, id: 1002 },
                { ...mockOrder, id: 1003 },
            ]

            wooCommerceApi.getOrders.mockReturnValue(of(orders))
            contactService.findAllPaginated.mockReturnValue(of({ data: [], total: 0, page: 1, limit: 1 }))
            contactService.createContact.mockReturnValue(of(mockContact as any))

            service.syncCustomers().subscribe((stats) => {
                // Should only create once due to deduplication
                expect(contactService.createContact).toHaveBeenCalledTimes(1)
                expect(stats.created).toBe(1)
                expect(stats.errors).toBe(0)
                done()
            })
        })
    })
})
