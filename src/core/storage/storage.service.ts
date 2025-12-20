import { Injectable, Logger } from '@nestjs/common'
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3'
import { Readable } from 'stream'
import { StorageConfigService } from './config/storage.config'

/**
 * Service for interacting with S3-compatible storage.
 */
@Injectable()
export class StorageService {
  private readonly s3Client?: S3Client
  private readonly logger = new Logger(StorageService.name)

  constructor(private readonly config: StorageConfigService) {
    if (!this.config.isEnabled) {
      this.logger.warn(
        'Storage is disabled via STORAGE_ENABLED=false. Storage operations will fail.',
      )
      return
    }

    // Validate required config when enabled
    if (!this.config.endpoint) {
      throw new Error('STORAGE_ENDPOINT is required when storage is enabled')
    }
    if (!this.config.region) {
      throw new Error('STORAGE_REGION is required when storage is enabled')
    }
    if (!this.config.bucketName) {
      throw new Error('STORAGE_BUCKET_NAME is required when storage is enabled')
    }

    const accessKeyId = this.config.accessKey
    const secretAccessKey = this.config.secretKey

    if (!accessKeyId || !secretAccessKey) {
      this.logger.warn(
        'Missing S3 credentials. Storage operations may fail if authentication is required.',
      )
    }

    this.s3Client = new S3Client({
      endpoint: this.config.endpoint,
      region: this.config.region,
      credentials:
        accessKeyId && secretAccessKey
          ? {
            accessKeyId,
            secretAccessKey,
          }
          : undefined,
      forcePathStyle: this.config.forcePathStyle,
    })
  }

  private ensureEnabled(): S3Client {
    if (!this.config.isEnabled || !this.s3Client) {
      throw new Error('Storage is disabled')
    }
    return this.s3Client
  }

  /**
   * Uploads a file to the configured bucket.
   * @param key - The unique key (path) for the file.
   * @param body - The file content.
   * @param contentType - Optional MIME type of the file.
   */
  async uploadFile(
    key: string,
    body: Buffer | Readable | string,
    contentType?: string,
  ): Promise<void> {
    const client = this.ensureEnabled()
    try {
      const command = new PutObjectCommand({
        Bucket: this.config.bucketName!,
        Key: key,
        Body: body,
        ContentType: contentType,
      })
      await client.send(command)
      this.logger.log(`File uploaded successfully: ${key}`)
    } catch (error) {
      this.logger.error(`Failed to upload file: ${key}`, error)
      throw error
    }
  }

  /**
   * Retrieves a file from the configured bucket.
   * @param key - The key of the file to retrieve.
   * @returns A Readable stream of the file content.
   */
  async getFile(key: string): Promise<Readable> {
    const client = this.ensureEnabled()
    try {
      const command = new GetObjectCommand({
        Bucket: this.config.bucketName!,
        Key: key,
      })
      const response = await client.send(command)
      if (!response.Body) {
        throw new Error('File body is empty')
      }
      return response.Body as Readable
    } catch (error) {
      this.logger.error(`Failed to get file: ${key}`, error)
      throw error
    }
  }

  /**
   * Deletes a file from the configured bucket.
   * @param key - The key of the file to delete.
   */
  async deleteFile(key: string): Promise<void> {
    const client = this.ensureEnabled()
    try {
      const command = new DeleteObjectCommand({
        Bucket: this.config.bucketName!,
        Key: key,
      })
      await client.send(command)
      this.logger.log(`File deleted successfully: ${key}`)
    } catch (error) {
      this.logger.error(`Failed to delete file: ${key}`, error)
      throw error
    }
  }
}
