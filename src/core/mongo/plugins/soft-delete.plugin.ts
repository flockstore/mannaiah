import { Schema } from 'mongoose'

/**
 * Mongoose plugin that adds soft delete functionality to schemas.
 *
 * This plugin:
 * - Adds `deletedAt` and `isDeleted` fields to the schema
 * - Modifies query methods to exclude soft-deleted documents by default
 * - Provides methods for soft deleting and restoring documents
 *
 * @param schema - The Mongoose schema to apply the plugin to
 */
export function softDeletePlugin(schema: Schema): void {
    // Add soft delete fields to the schema
    schema.add({
        deletedAt: {
            type: Date,
            default: null,
        },
        isDeleted: {
            type: Boolean,
            default: false,
        },
    })

    /**
     * Soft delete method - marks document as deleted without removing it
     */
    schema.methods.softDelete = async function () {
        this.isDeleted = true
        this.deletedAt = new Date()
        return this.save()
    }

    /**
     * Restore method - restores a soft-deleted document
     */
    schema.methods.restore = async function () {
        this.isDeleted = false
        this.deletedAt = null
        return this.save()
    }

    /**
   * Add query middleware to exclude soft-deleted documents by default
   * This applies to find, findOne, countDocuments, etc.
   */
    schema.pre('find', function (this: any) {
        const withDeleted = this.getOptions().withDeleted
        if (!withDeleted) {
            this.where({ isDeleted: { $ne: true } })
        }
    })

    schema.pre('findOne', function (this: any) {
        const withDeleted = this.getOptions().withDeleted
        if (!withDeleted) {
            this.where({ isDeleted: { $ne: true } })
        }
    })

    schema.pre('countDocuments', function (this: any) {
        const withDeleted = this.getOptions().withDeleted
        if (!withDeleted) {
            this.where({ isDeleted: { $ne: true } })
        }
    })

    /**
     * Add middleware for update operations
     */
    schema.pre('updateOne', function (this: any) {
        const withDeleted = this.getOptions().withDeleted
        if (!withDeleted) {
            this.where({ isDeleted: { $ne: true } })
        }
    })

    schema.pre('updateMany', function (this: any) {
        const withDeleted = this.getOptions().withDeleted
        if (!withDeleted) {
            this.where({ isDeleted: { $ne: true } })
        }
    })

    schema.pre('findOneAndUpdate', function (this: any) {
        const withDeleted = this.getOptions().withDeleted
        if (!withDeleted) {
            this.where({ isDeleted: { $ne: true } })
        }
    })

    /**
     * Add static method to find with deleted documents
     */
    schema.statics.findWithDeleted = function (filter = {}) {
        return this.find(filter).setOptions({ withDeleted: true })
    }

    /**
     * Add static method to find one with deleted documents
     */
    schema.statics.findOneWithDeleted = function (filter = {}) {
        return this.findOne(filter).setOptions({ withDeleted: true })
    }
}
