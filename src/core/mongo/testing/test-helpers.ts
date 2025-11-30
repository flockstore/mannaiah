import { Model } from 'mongoose'
import { BaseDocument } from '../schemas/base.schema'

/**
 * Clear all documents from a collection
 * @param model - The Mongoose model
 */
export async function clearCollection<T extends BaseDocument>(
    model: Model<T>,
): Promise<void> {
    await model.deleteMany({}).setOptions({ withDeleted: true })
}

/**
 * Count all documents in a collection (including soft-deleted)
 * @param model - The Mongoose model
 * @returns Total count of documents
 */
export async function countAllDocuments<T extends BaseDocument>(
    model: Model<T>,
): Promise<number> {
    return model.countDocuments({}).setOptions({ withDeleted: true })
}

/**
 * Helper to wait for a short period (useful for async operations in tests)
 * @param ms - Milliseconds to wait
 */
export const wait = (ms: number): Promise<void> =>
    new Promise((resolve) => setTimeout(resolve, ms))
