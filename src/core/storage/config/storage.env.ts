import { IsString, IsBoolean, IsOptional, ValidateIf } from 'class-validator'
import { Transform, Expose } from 'class-transformer'

/**
 * Environment variables for storage configuration.
 */
export class StorageEnvironmentVariables {
  @IsBoolean()
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @Expose()
  STORAGE_ENABLED: boolean = false

  @ValidateIf((o) => o.STORAGE_ENABLED)
  @IsString()
  @Expose()
  STORAGE_ENDPOINT: string

  @ValidateIf((o) => o.STORAGE_ENABLED)
  @IsString()
  @Expose()
  STORAGE_REGION: string

  @ValidateIf((o) => o.STORAGE_ENABLED)
  @IsString()
  @IsOptional()
  @Expose()
  STORAGE_ACCESS_KEY?: string

  @ValidateIf((o) => o.STORAGE_ENABLED)
  @IsString()
  @IsOptional()
  @Expose()
  STORAGE_SECRET_KEY?: string

  @ValidateIf((o) => o.STORAGE_ENABLED)
  @IsString()
  @Expose()
  STORAGE_BUCKET_NAME: string

  @IsBoolean()
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @Expose()
  STORAGE_FORCE_PATH_STYLE: boolean = true
}
