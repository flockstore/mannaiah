import { Injectable } from '@nestjs/common'
import { Observable, throwError, of } from 'rxjs'
import { switchMap, tap } from 'rxjs/operators'
import { BaseService } from '../../../core/mongo/services/base.service'
import {
  ContactDocument,
  ContactCreate,
  ContactUpdate,
} from '../interfaces/contact.interface'
import { ContactRepository } from '../repositories/contact.repository'
import { PhoneUtil } from '../utils/phone.util'

import {
  InvalidNameCombinationError,
  MissingNameError,
} from '../errors/contact.errors'

@Injectable()
export class ContactService extends BaseService<ContactDocument> {
  constructor(protected readonly repository: ContactRepository) {
    super(repository)
  }

  /**
   * Validate name combination rules.
   * A contact must have either a legal name OR a personal name (first + last), but not both.
   *
   * @param legalName - Legal name for entities.
   * @param firstName - First name for persons.
   * @param lastName - Last name for persons.
   * @throws InvalidNameCombinationError if both legalName and personal names are present.
   * @throws MissingNameError if neither legalName nor full personal name is present.
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
   * Create a new contact with validation.
   * Sanitizes phone number before creation.
   *
   * @param createDto - Data to create contact.
   * @returns Observable emitting the created contact.
   */
  createContact(createDto: ContactCreate): Observable<ContactDocument> {
    return of(createDto).pipe(
      tap((dto) => {
        this.validateNames(dto.legalName, dto.firstName, dto.lastName)
        if (dto.phone) {
          dto.phone = PhoneUtil.sanitize(dto.phone)
        }
      }),
      switchMap((dto) => this.repository.create(dto)),
    )
  }

  /**
   * Update a contact with validation.
   * If names are being updated, it fetches the existing contact to validate
   * the final state of the contact's names (merging existing data with updates)
   * to ensure name combination rules are still met.
   * Sanitizes phone number if provided.
   *
   * @param id - Contact ID.
   * @param updateDto - Data to update.
   * @returns Observable emitting the updated document or null if not found.
   */
  updateContact(
    id: string,
    updateDto: ContactUpdate,
  ): Observable<ContactDocument | null> {
    if (updateDto.phone) {
      updateDto.phone = PhoneUtil.sanitize(updateDto.phone)
    }

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
            return throwError(() => error as Error)
          }

          return this.repository.update(id, updateDto)
        }),
      )
    }

    return this.repository.update(id, updateDto)
  }
}
