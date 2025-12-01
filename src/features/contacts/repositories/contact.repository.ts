import { Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Model, FilterQuery } from 'mongoose'
import { Observable } from 'rxjs'
import { BaseRepository } from '../../../core/mongo/repositories/base.repository'
import { ContactDocument } from '../interfaces/contact.interface'
import { QueryOptions } from '../../../core/mongo/schemas/base.schema'

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
   * Override findAllPaginated to add contact-specific query preprocessing
   * (e.g., email normalization)
   * @param filter - Query filter
   * @param page - Page number (1-based)
   * @param limit - Items per page
   * @param options - Query options
   * @returns Observable emitting paginated results
   */
  findAllPaginated(
    filter: FilterQuery<ContactDocument> = {},
    page: number = 1,
    limit: number = 10,
    options?: QueryOptions,
  ): Observable<{ data: ContactDocument[]; total: number; page: number; limit: number }> {
    // Normalize email to lowercase for case-insensitive search
    if (filter.email) {
      filter.email = (filter.email as string).toLowerCase()
    }

    // Call parent implementation with preprocessed filter
    return super.findAllPaginated(filter, page, limit, options)
  }
}
