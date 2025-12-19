import { IsString, IsBoolean, IsOptional } from 'class-validator'
import { Transform } from 'class-transformer'

/**
 * Environment variables for storage configuration.
 */
export class StorageEnvironmentVariables {
    @IsString()
    STORAGE_ENDPOINT: string

    @IsString()
    STORAGE_REGION: string

    @IsString()
    @IsOptional()
    STORAGE_ACCESS_KEY?: string

    @IsString()
    @IsOptional()
    STORAGE_SECRET_KEY?: string

    @IsString()
    STORAGE_BUCKET_NAME: string

    @IsBoolean()
    @IsOptional()
    @Transform(({ value }) => value === 'true' || value === true)
    STORAGE_FORCE_PATH_STYLE: boolean = true
}
