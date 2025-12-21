import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { HydratedDocument } from 'mongoose'
import { randomUUID } from 'crypto'
import { softDeletePlugin } from '../../../core/mongo/plugins/soft-delete.plugin'
import { timestampPlugin } from '../../../core/mongo/plugins/timestamp.plugin'

export type AssetDocument = HydratedDocument<Asset>

/**
 * Represents a stored asset (file/image).
 */
@Schema({ timestamps: false, versionKey: false })
export class Asset {
  /**
   * Unique identifier for the asset (UUID).
   */
  @Prop({ default: randomUUID })
  _id: string

  /**
   * S3 Object Key.
   */
  @Prop({ required: true })
  key: string

  /**
   * Original filename.
   */
  @Prop({ required: true })
  originalName: string

  /**
   * MIME type of the file.
   */
  @Prop({ required: true })
  mimeType: string

  /**
   * Size of the file in bytes.
   */
  @Prop({ required: true })
  size: number

  // BaseDocument properties
  createdAt: Date
  updatedAt: Date
  deletedAt: Date | null
  isDeleted: boolean

  softDelete: () => Promise<this>
  restore: () => Promise<this>
}

export const AssetSchema = SchemaFactory.createForClass(Asset)

AssetSchema.plugin(softDeletePlugin)
AssetSchema.plugin(timestampPlugin)
