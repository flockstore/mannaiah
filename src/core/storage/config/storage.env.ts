import { IsString, IsBoolean, IsOptional } from 'class-validator'
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

  @IsString()
  @IsOptional()
  @Expose()
  STORAGE_ENDPOINT?: string

  @IsString()
  @IsOptional()
  @Expose()
  STORAGE_REGION?: string

  @IsString()
  @IsOptional()
  @Expose()
  STORAGE_ACCESS_KEY?: string

  @IsString()
  @IsOptional()
  @Expose()
  STORAGE_SECRET_KEY?: string

  @IsString()
  @IsOptional()
  @Expose()
  STORAGE_BUCKET_NAME?: string

  @IsBoolean()
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @Expose()
  STORAGE_FORCE_PATH_STYLE: boolean = true
}
