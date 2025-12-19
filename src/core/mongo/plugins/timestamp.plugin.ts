/* eslint-disable @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access */
import { Schema } from 'mongoose'

/**
 * Mongoose plugin that adds timestamp functionality to schemas.
 *
 * This plugin adds:
 * - `createdAt`: Automatically set when document is created
 * - `updatedAt`: Automatically updated when document is modified
 *
 * Note: This uses Mongoose's built-in timestamp functionality
 * with custom configuration.
 *
 * @param schema - The Mongoose schema to apply the plugin to
 */
export function timestampPlugin(schema: Schema): void {
  // Add timestamp fields
  schema.add({
    createdAt: {
      type: Date,
      default: Date.now,
      immutable: true, // Cannot be changed after creation
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  })

  // Update the updatedAt field before save
  schema.pre('save', function (next) {
    if (this.isNew) {
      const now = new Date()
      // Ensure both match exactly on creation
      this.createdAt = now
      this.updatedAt = now
    } else {
      this.updatedAt = new Date()
    }
    next()
  })

  // Update the updatedAt field for update operations
  const updateMiddleware = [
    'updateOne',
    'updateMany',
    'findOneAndUpdate',
  ] as const

  updateMiddleware.forEach((method) => {
    schema.pre(method, function (this: any, next) {
      this.set({ updatedAt: new Date() })
      next()
    })
  })
}
