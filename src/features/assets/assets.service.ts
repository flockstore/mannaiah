import { Injectable, NotFoundException } from '@nestjs/common'
import { AssetDocument } from './schemas/asset.schema'
import { StorageService } from '../../core/storage/storage.service'
import { randomUUID } from 'crypto'
import { AssetsRepository } from './assets.repository'
import { FilterQuery } from 'mongoose'
import { lastValueFrom } from 'rxjs'

@Injectable()
export class AssetsService {
  constructor(
    private readonly assetsRepository: AssetsRepository,
    private readonly storageService: StorageService,
  ) { }

  /**
   * Uploads a file to S3 and creates an asset record.
   * @param file - The file to upload.
   * @param customName - Optional custom name for the asset.
   * @returns The created asset.
   */
  async create(
    file: Express.Multer.File,
    customName?: string,
  ): Promise<AssetDocument> {
    const key = `assets/${randomUUID()}-${file.originalname}`

    await this.storageService.uploadFile(key, file.buffer, file.mimetype)

    return await lastValueFrom(
      this.assetsRepository.create({
        _id: randomUUID(),
        key,
        originalName: customName || file.originalname,
        mimeType: file.mimetype,
        size: file.size,
      }),
    )
  }

  /**
   * Finds an asset by ID.
   * @param id - Asset ID.
   * @returns The asset.
   */
  async findOne(id: string): Promise<AssetDocument> {
    const asset = await lastValueFrom(this.assetsRepository.findById(id))
    if (!asset) {
      throw new NotFoundException(`Asset with ID ${id} not found`)
    }
    return asset
  }

  /**
   * Find all assets with pagination.
   * @param filter - Filter query
   * @param page - Page number
   * @param limit - Page limit
   */
  findAllPaginated(
    filter: FilterQuery<AssetDocument>,
    page: number,
    limit: number,
  ) {
    return this.assetsRepository.findAllPaginated(filter, page, limit)
  }

  /**
   * Updates an asset's metadata.
   * @param id - Asset ID.
   * @param updateData - Data to update.
   * @returns The updated asset.
   */
  async update(
    id: string,
    updateData: Partial<AssetDocument>,
  ): Promise<AssetDocument> {
    const updatedAsset = await lastValueFrom(
      this.assetsRepository.update(id, updateData),
    )
    if (!updatedAsset) {
      throw new NotFoundException(`Asset with ID ${id} not found`)
    }
    return updatedAsset
  }

  /**
   * Deletes an asset from DB (soft) and S3 (hard).
   * @param id - Asset ID.
   */
  async remove(id: string): Promise<void> {
    const asset = await this.findOne(id)

    // Hard delete from S3
    try {
      await this.storageService.deleteFile(asset.key)
    } catch {
      // Ignore cleanup errors
    }

    // Soft delete from DB
    await lastValueFrom(this.assetsRepository.softDelete(id))
  }
}
