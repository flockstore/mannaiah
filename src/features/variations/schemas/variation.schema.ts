import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { HydratedDocument } from 'mongoose'
import { randomUUID } from 'crypto'

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
  @Prop({ default: randomUUID })
  _id: string

  /**
   * Valid display name (e.g., "Red", "XL").
   */
  @Prop({ required: true })
  name: string

  /**
   * Type of variation definition (COLOR, TEXT, SIZE).
   */
  @Prop({ required: true, enum: VariationDefinition })
  definition: VariationDefinition

  /**
   * Actual value (e.g., hex code for color, or text value).
   */
  @Prop({ required: true })
  value: string
}

export const VariationSchema = SchemaFactory.createForClass(Variation)
