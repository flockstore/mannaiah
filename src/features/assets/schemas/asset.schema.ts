import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { HydratedDocument } from 'mongoose'
import { randomUUID } from 'crypto'
import { softDeletePlugin } from '../../../core/mongo/plugins/soft-delete.plugin'
import { timestampPlugin } from '../../../core/mongo/plugins/timestamp.plugin'

import { ApiProperty } from '@nestjs/swagger'

export type AssetDocument = HydratedDocument<Asset>

/**
 * Represents a stored asset (file/image).
 */
@Schema({ timestamps: false, versionKey: false })
export class Asset {
  /**
   * Unique identifier for the asset (UUID).
   */
  @ApiProperty({
    description: 'Unique identifier',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @Prop({ default: randomUUID })
  _id: string

  /**
   * S3 Object Key.
   */
  @ApiProperty({ description: 'S3 Object Key', example: 'assets/image.png' })
  @Prop({ required: true })
  key: string

  /**
   * Original filename.
   */
  @ApiProperty({ description: 'Original filename', example: 'image.png' })
  @Prop({ required: true })
  originalName: string

  /**
   * MIME type of the file.
   */
  @ApiProperty({ description: 'MIME type', example: 'image/png' })
  @Prop({ required: true })
  mimeType: string

  /**
   * Size of the file in bytes.
   */
  @ApiProperty({ description: 'Size in bytes', example: 1024 })
  @Prop({ required: true })
  size: number

  // BaseDocument properties
  @ApiProperty({ description: 'Creation timestamp' })
  createdAt: Date

  @ApiProperty({ description: 'Last update timestamp' })
  updatedAt: Date

  @ApiProperty({
    description: 'Deletion timestamp',
    required: false,
    nullable: true,
  })
  deletedAt: Date | null

  @ApiProperty({ description: 'Is deleted flag' })
  isDeleted: boolean

  softDelete: () => Promise<this>
  restore: () => Promise<this>
}

export const AssetSchema = SchemaFactory.createForClass(Asset)

AssetSchema.plugin(softDeletePlugin)
AssetSchema.plugin(timestampPlugin)
