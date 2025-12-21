import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { HydratedDocument } from 'mongoose'
import { randomUUID } from 'crypto'

import { ApiProperty } from '@nestjs/swagger'

export type VariationDocument = HydratedDocument<Variation>

export enum VariationDefinition {
  COLOR = 'COLOR',
  TEXT = 'TEXT',
  SIZE = 'SIZE',
}

/**
 * Represents a product variation (e.g., Color, Size).
 */
@Schema({ timestamps: true })
export class Variation {
  /**
   * Unique identifier (UUID).
   */
  @ApiProperty({ description: 'Unique identifier' })
  @Prop({ default: randomUUID })
  _id: string

  /**
   * Valid display name (e.g., "Red", "XL").
   */
  @ApiProperty({ description: 'Variation name', example: 'Red' })
  @Prop({ required: true })
  name: string

  /**
   * Type of variation definition (COLOR, TEXT, SIZE).
   */
  @ApiProperty({ description: 'Variation type', enum: VariationDefinition })
  @Prop({ required: true, enum: VariationDefinition })
  definition: VariationDefinition

  /**
   * Actual value (e.g., hex code for color, or text value).
   */
  @ApiProperty({ description: 'Variation value', example: '#FF0000' })
  @Prop({ required: true })
  value: string

  @ApiProperty({ description: 'Creation timestamp' })
  @Prop()
  createdAt: Date

  @ApiProperty({ description: 'Last update timestamp' })
  @Prop()
  updatedAt: Date

  @ApiProperty({ description: 'Is deleted flag' })
  @Prop({ default: false })
  isDeleted: boolean

  @ApiProperty({
    description: 'Deletion timestamp',
    required: false,
    nullable: true,
  })
  @Prop({ type: Date, default: null })
  deletedAt: Date | null

  softDelete: () => Promise<this>
  restore: () => Promise<this>
}

export const VariationSchema = SchemaFactory.createForClass(Variation)
