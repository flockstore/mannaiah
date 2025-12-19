import { Type } from 'class-transformer'
import {
  IsString,
  IsNotEmpty,
  IsBoolean,
  IsArray,
  ValidateNested,
  IsOptional,
  IsObject,
} from 'class-validator'
import { ApiProperty } from '@nestjs/swagger'

/**
 * DTO for a gallery item.
 */
export class GalleryItemDto {
  /**
   * Reference to Asset ID.
   */
  @ApiProperty({ description: 'Asset ID' })
  @IsString()
  @IsNotEmpty()
  assetId: string

  /**
   * Is main image.
   */
  @ApiProperty({ description: 'Is main image', required: false })
  @IsBoolean()
  @IsOptional()
  isMain?: boolean

  /**
   * Excluded realms.
   */
  @ApiProperty({
    description: 'Excluded realms',
    required: false,
    type: [String],
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  excludedRealms?: string[]

  /**
   * Linked variation ID.
   */
  @ApiProperty({ description: 'Linked variation ID', required: false })
  @IsString()
  @IsOptional()
  variationId?: string
}

/**
 * DTO for a datasheet.
 */
export class DatasheetDto {
  /**
   * Realm identifier.
   */
  @ApiProperty({ description: 'Realm identifier' })
  @IsString()
  @IsNotEmpty()
  realm: string

  /**
   * Product name.
   */
  @ApiProperty({ description: 'Product name' })
  @IsString()
  @IsNotEmpty()
  name: string

  /**
   * Product description.
   */
  @ApiProperty({ description: 'Product description', required: false })
  @IsString()
  @IsOptional()
  description?: string

  /**
   * Key-Value attributes.
   */
  @ApiProperty({ description: 'Key-Value attributes', required: false })
  @IsObject()
  @IsOptional()
  attributes?: Record<string, any>
}

/**
 * DTO for creating a product.
 */
export class CreateProductDto {
  /**
   * SKU.
   */
  @ApiProperty({ description: 'Stock Keeping Unit' })
  @IsString()
  @IsNotEmpty()
  sku: string

  /**
   * Gallery items.
   */
  @ApiProperty({
    description: 'Gallery items',
    required: false,
    type: [GalleryItemDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => GalleryItemDto)
  @IsOptional()
  gallery?: GalleryItemDto[]

  /**
   * Datasheets.
   */
  @ApiProperty({
    description: 'Datasheets',
    required: false,
    type: [DatasheetDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DatasheetDto)
  @IsOptional()
  datasheets?: DatasheetDto[]

  /**
   * Variations (List of IDs).
   */
  @ApiProperty({
    description: 'List of Variation IDs',
    required: false,
    type: [String],
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  variations?: string[]
}

/**
 * DTO for updating a product.
 */
export class UpdateProductDto {
  /**
   * Gallery items.
   */
  @ApiProperty({
    description: 'Gallery items',
    required: false,
    type: [GalleryItemDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => GalleryItemDto)
  @IsOptional()
  gallery?: GalleryItemDto[]

  /**
   * Datasheets.
   */
  @ApiProperty({
    description: 'Datasheets',
    required: false,
    type: [DatasheetDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DatasheetDto)
  @IsOptional()
  datasheets?: DatasheetDto[]

  /**
   * Variations (List of IDs).
   */
  @ApiProperty({
    description: 'List of Variation IDs',
    required: false,
    type: [String],
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  variations?: string[]
}
