import { Schema } from 'mongoose'
import { randomUUID } from 'crypto'
import { ContactDocument, DocumentType } from '../interfaces/contact.interface'
import { softDeletePlugin } from '../../../core/mongo/plugins/soft-delete.plugin'
import { timestampPlugin } from '../../../core/mongo/plugins/timestamp.plugin'

/**
 * Mongoose schema for Contact documents
 */
export const ContactSchema = new Schema<ContactDocument>(
  {
    _id: {
      type: String,
      default: randomUUID,
    },
    documentType: {
      type: String,
      enum: Object.values(DocumentType),
      required: false,
      index: true,
    },
    documentNumber: {
      type: String,
      required: false,
      trim: true,
      index: true,
    },
    legalName: {
      type: String,
      trim: true,
      default: undefined,
    },
    firstName: {
      type: String,
      trim: true,
      default: undefined,
    },
    lastName: {
      type: String,
      trim: true,
      default: undefined,
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      unique: true,
    },
    phone: {
      type: String,
      trim: true,
    },
    address: {
      type: String,
      trim: true,
    },
    addressExtra: {
      type: String,
      trim: true,
    },
    cityCode: {
      type: String,
      trim: true,
    },
  },
  {
    collection: 'contacts',
    // Disable built-in timestamps as we use our custom plugin
    timestamps: false,
  },
)

// Apply plugins
ContactSchema.plugin(softDeletePlugin)
ContactSchema.plugin(timestampPlugin)

// Create compound unique index on documentType and documentNumber
// This ensures no duplicate documents with same type and number, but allows nulls (sparse)
ContactSchema.index(
  { documentType: 1, documentNumber: 1 },
  {
    unique: true,
    name: 'unique_document',
    sparse: true,
  },
)

// Validation for name combination
ContactSchema.pre('save', function (next) {
  const hasLegalName = !!this.legalName
  const hasFirstName = !!this.firstName
  const hasLastName = !!this.lastName

  // Check: Cannot have both legalName and personal names
  if (hasLegalName && (hasFirstName || hasLastName)) {
    return next(
      new Error(
        'Cannot have both legalName and personal names (firstName/lastName)',
      ),
    )
  }

  // Check: Must have either legalName OR both firstName and lastName
  if (!hasLegalName && (!hasFirstName || !hasLastName)) {
    return next(
      new Error('Must provide either legalName OR both firstName and lastName'),
    )
  }

  next()
})

/**
 * Contact model name
 */
export const Contact = 'Contact'
