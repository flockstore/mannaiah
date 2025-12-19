import { IsString, IsNotEmpty, IsEnum, IsOptional } from 'class-validator'
import { VariationDefinition } from '../schemas/variation.schema'
import { ApiProperty } from '@nestjs/swagger'

/**
 * DTO for creating a new variation.
 */
export class CreateVariationDto {
  /**
   * Display name of the variation.
   */
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  name: string

  /**
   * Type definition of the variation.
   */
  @ApiProperty({ enum: VariationDefinition })
  @IsEnum(VariationDefinition)
  definition: VariationDefinition

  /**
   * Value of the variation.
   */
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  value: string
}

/**
 * DTO for updating an existing variation.
 */
export class UpdateVariationDto {
  /**
   * Display name of the variation.
   */
  @ApiProperty({ required: false })
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  name?: string

  /**
   * Type definition of the variation.
   */
  @ApiProperty({ enum: VariationDefinition, required: false })
  @IsEnum(VariationDefinition)
  @IsOptional()
  definition?: VariationDefinition

  /**
   * Value of the variation.
   */
  @ApiProperty({ required: false })
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  value?: string
}
