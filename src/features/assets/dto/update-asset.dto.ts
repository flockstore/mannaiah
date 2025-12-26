import { IsString, IsNotEmpty } from 'class-validator'
import { ApiProperty } from '@nestjs/swagger'

export class UpdateAssetDto {
  @ApiProperty({
    description: 'New name for the asset',
    example: 'new-image-name.png',
  })
  @IsString()
  @IsNotEmpty()
  originalName: string
}
