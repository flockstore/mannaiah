import { Document, Types } from 'mongoose'

/**
 * Methods added by the soft delete plugin
 */
export interface SoftDeleteMethods {
  /**
   * Soft delete this document (marks as deleted without removing from database)
   * @returns Promise resolving to the soft-deleted document
   */
  softDelete(): Promise<this>

  /**
   * Restore a soft-deleted document
   * @returns Promise resolving to the restored document
   */
  restore(): Promise<this>
}

/**
 * Base interface for all MongoDB documents.
 * Includes common fields for auditing and soft delete functionality.
 */
export interface BaseDocument extends Document, SoftDeleteMethods {
  /**
   * MongoDB unique identifier
   */
  _id: Types.ObjectId

  /**
   * Timestamp when the document was created
   */
  createdAt: Date

  /**
   * Timestamp when the document was last updated
   */
  updatedAt: Date

  /**
   * Timestamp when the document was soft deleted (null if not deleted)
   */
  deletedAt: Date | null

  /**
   * Flag indicating if the document is soft deleted
   */
  isDeleted: boolean
}

/**
 * Options for querying documents with soft delete support
 */
export interface QueryOptions {
  /**
   * Include soft-deleted documents in the query results
   */
  withDeleted?: boolean
}
