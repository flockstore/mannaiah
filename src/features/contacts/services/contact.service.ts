import { Injectable } from '@nestjs/common'
import { Observable, throwError, of } from 'rxjs'
import { map, switchMap, tap } from 'rxjs/operators'
import { BaseService } from '../../../core/mongo/services/base.service'
import {
    ContactDocument,
    CreateContactDto,
    UpdateContactDto,
    DocumentType,
} from '../interfaces/contact.interface'
import { ContactRepository } from '../repositories/contact.repository'

export class InvalidNameCombinationError extends Error {
    constructor() {
        super('Cannot have both legalName and personal names')
    }
}

export class MissingNameError extends Error {
    constructor() {
        super('Must provide either legalName OR both firstName and lastName')
    }
}

@Injectable()
export class ContactService extends BaseService<ContactDocument> {
    constructor(protected readonly repository: ContactRepository) {
        super(repository)
    }

    /**
     * Validate name combination rules
     * @param legalName - Legal name for entities
     * @param firstName - First name for persons
     * @param lastName - Last name for persons
     * @throws InvalidNameCombinationError if both legalName and personal names are present
     * @throws MissingNameError if neither legalName nor full personal name is present
     */
    validateNames(
        legalName?: string,
        firstName?: string,
        lastName?: string,
    ): void {
        const hasLegalName = !!legalName
        const hasPersonalName = !!firstName || !!lastName
        const hasFullPersonalName = !!firstName && !!lastName

        if (hasLegalName && hasPersonalName) {
            throw new InvalidNameCombinationError()
        }

        if (!hasLegalName && !hasFullPersonalName) {
            throw new MissingNameError()
        }
    }

    /**
     * Create a new contact with validation
     * @param createDto - Data to create contact
     * @returns Observable emitting the created contact
     */
    createContact(createDto: CreateContactDto): Observable<ContactDocument> {
        return of(createDto).pipe(
            tap((dto) =>
                this.validateNames(dto.legalName, dto.firstName, dto.lastName),
            ),
            switchMap((dto) => this.repository.create(dto)),
        )
    }

    /**
     * Find a contact by document type and number
     * @param documentType - Type of document
     * @param documentNumber - Document number
     * @returns Observable emitting the contact or null
     */
    findByDocument(
        documentType: DocumentType,
        documentNumber: string,
    ): Observable<ContactDocument | null> {
        return this.repository.findByDocument(documentType, documentNumber)
    }

    /**
     * Find contacts by email
     * @param email - Email address
     * @returns Observable emitting array of contacts
     */
    findByEmail(email: string): Observable<ContactDocument[]> {
        return this.repository.findByEmail(email)
    }

    /**
     * Update a contact with validation
     * @param id - Contact ID
     * @param updateDto - Data to update
     * @returns Observable emitting the updated contact or null
     */
    updateContact(
        id: string,
        updateDto: UpdateContactDto,
    ): Observable<ContactDocument | null> {
        // If names are being updated, we need to validate against existing data + updates
        if (
            updateDto.legalName !== undefined ||
            updateDto.firstName !== undefined ||
            updateDto.lastName !== undefined
        ) {
            return this.findById(id).pipe(
                switchMap((existingContact) => {
                    if (!existingContact) {
                        return of(null)
                    }

                    const legalName =
                        updateDto.legalName !== undefined
                            ? updateDto.legalName
                            : existingContact.legalName
                    const firstName =
                        updateDto.firstName !== undefined
                            ? updateDto.firstName
                            : existingContact.firstName
                    const lastName =
                        updateDto.lastName !== undefined
                            ? updateDto.lastName
                            : existingContact.lastName

                    try {
                        this.validateNames(legalName, firstName, lastName)
                    } catch (error) {
                        return throwError(() => error)
                    }

                    return this.repository.update(id, updateDto)
                }),
            )
        }

        return this.repository.update(id, updateDto)
    }
}
