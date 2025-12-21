import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { HydratedDocument } from 'mongoose'
import { randomUUID } from 'crypto'

export type ProductDocument = HydratedDocument<Product>

/**
 * Represents an image in the product gallery.
 */
@Schema()
export class ProductGalleryItem {
  /**
   * S3 Asset ID for the image.
   */
  @Prop({ required: true })
  assetId: string

  /**
   * Whether this is the main cover image.
   */
  @Prop({ default: false })
  isMain: boolean

  /**
   * List of realms where this image should be hidden.
   * If empty, it appears in all realms.
   */
  @Prop({ type: [String], default: [] })
  excludedRealms: string[]

  /**
   * Optional ID to link this image to a specific variation.
   */
  @Prop()
  variationId?: string
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
  @Prop({ required: true })
  realm: string

  /**
   * Product name for this realm.
   */
  @Prop({ required: true })
  name: string

  /**
   * Product description for this realm.
   */
  @Prop()
  description: string

  /**
   * Key-Value attributes for this realm (e.g., categories, specs).
   */
  @Prop({ type: Object, default: {} })
  attributes: Record<string, any>
}

export const ProductDatasheetSchema =
  SchemaFactory.createForClass(ProductDatasheet)

/**
 * Main Product Schema.
 */
@Schema({ timestamps: true })
export class Product {
  /**
   * Unique identifier for the product (UUID).
   */
  @Prop({ default: randomUUID })
  _id: string

  /**
   * Stock Keeping Unit - Unique identifier for the product.
   */
  @Prop({ required: true, unique: true, index: true })
  sku: string

  /**
   * Collection of product images.
   */
  @Prop({ type: [ProductGalleryItemSchema], default: [] })
  gallery: ProductGalleryItem[]

  /**
   * Realm-specific product information.
   */
  @Prop({ type: [ProductDatasheetSchema], default: [] })
  datasheets: ProductDatasheet[]

  /**
   * List of product variations (IDs).
   */
  @Prop({ type: [String], default: [] })
  variations: string[]

  @Prop()
  createdAt: Date

  @Prop()
  updatedAt: Date

  @Prop({ default: false })
  isDeleted: boolean

  @Prop({ type: Date, default: null })
  deletedAt: Date | null

  softDelete: () => Promise<this>
  restore: () => Promise<this>
}

export const ProductSchema = SchemaFactory.createForClass(Product)
