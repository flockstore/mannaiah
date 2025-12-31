import { Model, FilterQuery, UpdateQuery, Types } from 'mongoose'
import { Observable, from, switchMap, of } from 'rxjs'
import { BaseDocument, QueryOptions } from '../schemas/base.schema'

/**
 * Generic repository for Mongoose models using RxJS Observables.
 * Provides standard CRUD operations with soft delete support.
 *
 * @template T - The document interface extending BaseDocument
 */
export class BaseRepository<T extends BaseDocument> {
  constructor(protected readonly model: Model<T>) {}

  /**
   * Create a new document
   * @param data - The data to create the document with
   * @returns Observable emitting the created document
   */
  create(data: Partial<T>): Observable<T> {
    // Prevent manual setting of isDeleted on creation
    if (data && typeof data === 'object' && 'isDeleted' in data) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      delete (data as any).isDeleted
    }

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
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
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

  /**
   * Find documents with pagination
   * @param filter - Query filter
   * @param page - Page number (1-based)
   * @param limit - Items per page
   * @param options - Query options (e.g., withDeleted)
   * @param sort - Sort criteria (string or object)
   * @param excludeIds - List of IDs to exclude
   * @returns Observable emitting paginated results with metadata
   */
  findAllPaginated(
    filter: FilterQuery<T> = {},
    page: number = 1,
    limit: number = 10,
    options?: QueryOptions,
    sort?: string | Record<string, 1 | -1>,
    excludeIds?: string[],
  ): Observable<{ data: T[]; total: number; page: number; limit: number }> {
    const skip = (page - 1) * limit

    if (excludeIds && excludeIds.length > 0) {
      // Reverting casting to ObjectId as we use UUID string IDs
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      ;(filter as any)._id = { $nin: excludeIds }
    }

    const countPromise = this.model
      .countDocuments(filter)
      .setOptions(options || {})
      .exec()

    const dataPromise = this.model
      .find(filter)
      .setOptions(options || {})
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .exec()

    return from(
      Promise.all([dataPromise, countPromise]).then(([data, total]) => ({
        data,
        total,
        page,
        limit,
      })),
    )
  }
}
