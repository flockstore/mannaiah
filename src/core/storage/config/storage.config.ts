import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { StorageEnvironmentVariables } from './storage.env'

/**
 * Service to access storage configuration.
 */
@Injectable()
export class StorageConfigService {
  constructor(
    private configService: ConfigService<StorageEnvironmentVariables, true>,
  ) {}

  /**
   * The storage endpoint URL.
   */
  get endpoint(): string {
    return this.configService.get('STORAGE_ENDPOINT', { infer: true })
  }

  /**
   * The storage region.
   */
  get region(): string {
    return this.configService.get('STORAGE_REGION', { infer: true })
  }

  /**
   * The storage access key.
   */
  get accessKey(): string | undefined {
    return this.configService.get('STORAGE_ACCESS_KEY', { infer: true })
  }

  /**
   * The storage secret key.
   */
  get secretKey(): string | undefined {
    return this.configService.get('STORAGE_SECRET_KEY', { infer: true })
  }

  /**
   * The target bucket name.
   */
  get bucketName(): string {
    return this.configService.get('STORAGE_BUCKET_NAME', { infer: true })
  }

  /**
   * Whether to force path style URLs.
   */
  get forcePathStyle(): boolean {
    return this.configService.get('STORAGE_FORCE_PATH_STYLE', { infer: true })
  }
}
