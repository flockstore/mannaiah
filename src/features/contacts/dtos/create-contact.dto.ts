import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import {
  IsEnum,
  IsNotEmpty,
  IsString,
  IsOptional,
  IsEmail,
  ValidateIf,
} from 'class-validator'
import { DocumentType } from '../interfaces/contact.interface'

export class ContactCreate {
  @ApiProperty({
    enum: DocumentType,
    description: 'Type of identification document',
  })
  @IsEnum(DocumentType)
  @IsNotEmpty()
  documentType: DocumentType

  @ApiProperty({ description: 'Document number' })
  @IsString()
  @IsNotEmpty()
  documentNumber: string

  @ApiPropertyOptional({
    description: 'Legal name (required if no first/last name)',
  })
  @ValidateIf((o) => !o.firstName && !o.lastName)
  @IsString()
  @IsNotEmpty()
  legalName?: string

  @ApiPropertyOptional({
    description: 'First name (required if no legal name)',
  })
  @ValidateIf((o) => !o.legalName)
  @IsString()
  @IsNotEmpty()
  firstName?: string

  @ApiPropertyOptional({ description: 'Last name (required if no legal name)' })
  @ValidateIf((o) => !o.legalName)
  @IsString()
  @IsNotEmpty()
  lastName?: string

  @ApiProperty({ description: 'Email address' })
  @IsEmail()
  @IsNotEmpty()
  email: string

  @ApiPropertyOptional({ description: 'Phone number' })
  @IsString()
  @IsOptional()
  phone?: string

  @ApiPropertyOptional({ description: 'Physical address' })
  @IsString()
  @IsOptional()
  address?: string

  @ApiPropertyOptional({ description: 'Address extra info' })
  @IsString()
  @IsOptional()
  addressExtra?: string

  @ApiPropertyOptional({ description: 'City code' })
  @IsString()
  @IsOptional()
  cityCode?: string
}
