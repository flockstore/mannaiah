import { Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Model } from 'mongoose'
import { Observable, from } from 'rxjs'
import { BaseRepository } from '../../../core/mongo/repositories/base.repository'
import { ContactDocument, DocumentType } from '../interfaces/contact.interface'

/**
 * Repository for Contact documents.
 * Extends BaseRepository to provide standard CRUD operations.
 */
@Injectable()
export class ContactRepository extends BaseRepository<ContactDocument> {
  constructor(
    @InjectModel('Contact') readonly contactModel: Model<ContactDocument>,
  ) {
    super(contactModel)
  }

  /**
   * Find a contact by document type and number
   * @param documentType - Type of document (CC, CE, etc.)
   * @param documentNumber - Document number
   * @returns Observable emitting the contact or null
   */
  findByDocument(
    documentType: DocumentType,
    documentNumber: string,
  ): Observable<ContactDocument | null> {
    return from(this.model.findOne({ documentType, documentNumber }).exec())
  }

  /**
   * Find contacts by email
   * @param email - Email address
   * @returns Observable emitting array of contacts
   */
  findByEmail(email: string): Observable<ContactDocument[]> {
    return from(this.model.find({ email: email.toLowerCase() }).exec())
  }
}
