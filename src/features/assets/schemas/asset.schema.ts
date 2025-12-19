import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { HydratedDocument } from 'mongoose'
import { randomUUID } from 'crypto'

export type AssetDocument = HydratedDocument<Asset>

/**
 * Represents a stored asset (file/image).
 */
@Schema({ timestamps: true })
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
}

export const AssetSchema = SchemaFactory.createForClass(Asset)
