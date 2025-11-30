import { Model, FilterQuery, UpdateQuery, Types } from 'mongoose'
import { Observable, from, map, switchMap, of } from 'rxjs'
import { BaseDocument, QueryOptions } from '../schemas/base.schema'

/**
 * Generic repository for Mongoose models using RxJS Observables.
 * Provides standard CRUD operations with soft delete support.
 *
 * @template T - The document interface extending BaseDocument
 */
export class BaseRepository<T extends BaseDocument> {
  constructor(protected readonly model: Model<T>) { }

  /**
   * Create a new document
   * @param data - The data to create the document with
   * @returns Observable emitting the created document
   */
  create(data: Partial<T>): Observable<T> {
    return from(this.model.create(data))
  }

  /**
   * Find a document by ID
   * @param id - Document ID
   * @param options - Query options (e.g., withDeleted)
   * @returns Observable emitting the document or null
   */
  findById(
    id: string | Types.ObjectId,
    options?: QueryOptions,
  ): Observable<T | null> {
    return from(
      this.model
        .findById(id)
        .setOptions(options || {})
        .exec(),
    )
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
    return from(
      this.model
        .findOne(filter)
        .setOptions(options || {})
        .exec(),
    )
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
    return from(
      this.model
        .find(filter)
        .setOptions(options || {})
        .exec(),
    )
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
    // Prevent manual update of isDeleted
    if (data && typeof data === 'object' && 'isDeleted' in data) {
      delete (data as any).isDeleted
    }

    return from(
      this.model
        .findByIdAndUpdate(id, data, { new: true })
        .setOptions(options || {})
        .exec(),
    )
  }

  /**
   * Soft delete a document by ID
   * @param id - Document ID
   * @returns Observable emitting the soft-deleted document or null
   */
  softDelete(id: string | Types.ObjectId): Observable<T | null> {
    return from(
      this.model.findById(id).setOptions({ withDeleted: true }).exec(),
    ).pipe(
      switchMap((document) => {
        if (!document) return of(null)
        return from(document.softDelete())
      }),
    )
  }

  /**
   * Restore a soft-deleted document
   * @param id - Document ID
   * @returns Observable emitting the restored document or null
   */
  restore(id: string | Types.ObjectId): Observable<T | null> {
    return from(
      this.model.findById(id).setOptions({ withDeleted: true }).exec(),
    ).pipe(
      switchMap((document) => {
        if (!document) return of(null)
        return from(document.restore())
      }),
    )
  }

  /**
   * Permanently delete a document (hard delete)
   * @param id - Document ID
   * @returns Observable emitting the deleted document or null
   */
  hardDelete(id: string | Types.ObjectId): Observable<T | null> {
    return from(this.model.findByIdAndDelete(id).exec())
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
    return from(
      this.model
        .countDocuments(filter)
        .setOptions(options || {})
        .exec(),
    )
  }

  /**
   * Check if a document exists matching the filter
   * @param filter - Query filter
   * @param options - Query options
   * @returns Observable emitting true if exists, false otherwise
   */
  exists(filter: FilterQuery<T>, options?: QueryOptions): Observable<boolean> {
    return from(
      this.model
        .exists(filter)
        .setOptions(options || {})
        .then((result) => !!result),
    )
  }
}
