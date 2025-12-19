import { IsString, IsBoolean, IsOptional } from 'class-validator'
import { Transform, Expose } from 'class-transformer'

/**
 * Environment variables for storage configuration.
 */
export class StorageEnvironmentVariables {
  @IsString()
  @Expose()
  STORAGE_ENDPOINT: string

  @IsString()
  @Expose()
  STORAGE_REGION: string

  @IsString()
  @IsOptional()
  @Expose()
  STORAGE_ACCESS_KEY?: string

  @IsString()
  @IsOptional()
  @Expose()
  STORAGE_SECRET_KEY?: string

  @IsString()
  @Expose()
  STORAGE_BUCKET_NAME: string

  @IsBoolean()
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @Expose()
  STORAGE_FORCE_PATH_STYLE: boolean = true
}
