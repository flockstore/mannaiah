import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { HydratedDocument } from 'mongoose'
import { randomUUID } from 'crypto'

import { ApiProperty } from '@nestjs/swagger'

export type ProductDocument = HydratedDocument<Product>

/**
 * Represents an image in the product gallery.
 */
@Schema()
export class ProductGalleryItem {
  /**
   * S3 Asset ID for the image.
   */
  @ApiProperty({ description: 'S3 Asset ID' })
  @Prop({ required: true })
  assetId: string

  /**
   * Whether this is the main cover image.
   */
  @ApiProperty({
    description: 'Is main image',
    required: false,
    default: false,
  })
  @Prop({ default: false })
  isMain: boolean

  /**
   * List of realms where this image should be hidden.
   * If empty, it appears in all realms.
   */
  @ApiProperty({
    description: 'Excluded realms',
    type: [String],
    required: false,
  })
  @Prop({ type: [String], default: [] })
  excludedRealms: string[]

  /**
   * Optional IDs to link this image to specific variations.
   */
  @ApiProperty({
    description: 'Linked variation IDs',
    required: false,
    type: [String],
  })
  @Prop({ type: [String], default: [] })
  variationIds?: string[]
}

export const ProductGalleryItemSchema =
  SchemaFactory.createForClass(ProductGalleryItem)

/**
 * Represents product details specific to a realm.
 */
@Schema()
export class ProductDatasheet {
  /**
   * The realm identifier (e.g., 'default', 'falabella').
   */
  @ApiProperty({ description: 'Realm identifier' })
  @Prop({ required: true })
  realm: string

  /**
   * Product name for this realm.
   */
  @ApiProperty({ description: 'Product name' })
  @Prop({ required: true })
  name: string

  /**
   * Product description for this realm.
   */
  @ApiProperty({ description: 'Product description', required: false })
  @Prop()
  description: string

  /**
   * Key-Value attributes for this realm (e.g., categories, specs).
   */
  @ApiProperty({ description: 'Key-Value attributes', required: false })
  @Prop({ type: Object, default: {} })
  attributes: Record<string, any>
}

export const ProductDatasheetSchema =
  SchemaFactory.createForClass(ProductDatasheet)

/**
 * Main Product Schema.
 */

@Schema()
export class ProductVariant {
  /**
   * List of variation IDs defining this variant (e.g., [ColorId, SizeId]).
   */
  @ApiProperty({ description: 'List of variation IDs', type: [String] })
  @Prop({ type: [String], required: true })
  variationIds: string[]

  /**
   * Specific SKU for this variant.
   * If not provided, it defaults to the main product SKU.
   */
  @ApiProperty({
    description:
      'Variant SKU. If not provided, it defaults to the main product SKU.',
    required: false,
  })
  @Prop()
  sku?: string
}

export const ProductVariantSchema = SchemaFactory.createForClass(ProductVariant)

/**
 * Main Product Schema.
 */
@Schema({ timestamps: true })
export class Product {
  /**
   * Unique identifier for the product (UUID).
   */
  @ApiProperty({ description: 'Unique identifier' })
  @Prop({ default: randomUUID })
  _id: string

  /**
   * Stock Keeping Unit - Unique identifier for the product.
   */
  @ApiProperty({ description: 'Stock Keeping Unit' })
  @Prop({ required: true, unique: true, index: true })
  sku: string

  /**
   * Collection of product images.
   */
  @ApiProperty({ description: 'Product gallery', type: [ProductGalleryItem] })
  @Prop({ type: [ProductGalleryItemSchema], default: [] })
  gallery: ProductGalleryItem[]

  /**
   * Realm-specific product information.
   */
  @ApiProperty({ description: 'Product datasheets', type: [ProductDatasheet] })
  @Prop({ type: [ProductDatasheetSchema], default: [] })
  datasheets: ProductDatasheet[]

  /**
   * List of product variations (IDs).
   */
  @ApiProperty({ description: 'List of variation IDs', type: [String] })
  @Prop({ type: [String], default: [] })
  variations: string[]

  /**
   * List of product variants with specific SKUs.
   */
  @ApiProperty({ description: 'Product variants', type: [ProductVariant] })
  @Prop({ type: [ProductVariantSchema], default: [] })
  variants: ProductVariant[]

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

export const ProductSchema = SchemaFactory.createForClass(Product)
