import { FilterQuery, UpdateQuery, Types } from 'mongoose'
import { Observable } from 'rxjs'
import { BaseDocument, QueryOptions } from '../schemas/base.schema'
import { BaseRepository } from '../repositories/base.repository'

/**
 * Generic service for business logic using RxJS Observables.
 * Wraps the repository and provides a layer for additional logic.
 *
 * @template T - The document interface extending BaseDocument
 */
export class BaseService<T extends BaseDocument> {
  constructor(protected readonly repository: BaseRepository<T>) {}

  /**
   * Create a new document
   * @param data - The data to create the document with
   * @returns Observable emitting the created document
   */
  create(data: Partial<T>): Observable<T> {
    return this.repository.create(data)
  }

  /**
   * Find a document by ID
   * @param id - Document ID
   * @param options - Query options
   * @returns Observable emitting the document or null
   */
  findById(
    id: string | Types.ObjectId,
    options?: QueryOptions,
  ): Observable<T | null> {
    return this.repository.findById(id, options)
  }

  /**
   * Find a single document by filter
   * @param filter - Query filter
   * @param options - Query options
   * @returns Observable emitting the document or null
   */
  findOne(
    filter: FilterQuery<T>,
    options?: QueryOptions,
  ): Observable<T | null> {
    return this.repository.findOne(filter, options)
  }

  /**
   * Find all documents matching filter
   * @param filter - Query filter
   * @param options - Query options
   * @returns Observable emitting array of documents
   */
  findAll(
    filter: FilterQuery<T> = {},
    options?: QueryOptions,
  ): Observable<T[]> {
    return this.repository.findAll(filter, options)
  }

  /**
   * Update a document by ID
   * @param id - Document ID
   * @param data - Update data
   * @param options - Query options
   * @returns Observable emitting the updated document or null
   */
  update(
    id: string | Types.ObjectId,
    data: UpdateQuery<T>,
    options?: QueryOptions,
  ): Observable<T | null> {
    return this.repository.update(id, data, options)
  }

  /**
   * Soft delete a document by ID
   * @param id - Document ID
   * @returns Observable emitting the soft-deleted document or null
   */
  softDelete(id: string | Types.ObjectId): Observable<T | null> {
    return this.repository.softDelete(id)
  }

  /**
   * Restore a soft-deleted document
   * @param id - Document ID
   * @returns Observable emitting the restored document or null
   */
  restore(id: string | Types.ObjectId): Observable<T | null> {
    return this.repository.restore(id)
  }

  /**
   * Permanently delete a document (hard delete)
   * @param id - Document ID
   * @returns Observable emitting the deleted document or null
   */
  hardDelete(id: string | Types.ObjectId): Observable<T | null> {
    return this.repository.hardDelete(id)
  }

  /**
   * Count documents matching filter
   * @param filter - Query filter
   * @param options - Query options
   * @returns Observable emitting the count
   */
  count(
    filter: FilterQuery<T> = {},
    options?: QueryOptions,
  ): Observable<number> {
    return this.repository.count(filter, options)
  }

  /**
   * Check if a document exists matching the filter
   * @param filter - Query filter
   * @param options - Query options
   * @returns Observable emitting true if exists, false otherwise
   */
  exists(filter: FilterQuery<T>, options?: QueryOptions): Observable<boolean> {
    return this.repository.exists(filter, options)
  }
}
