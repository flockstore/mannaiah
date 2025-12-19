import { Injectable, NotFoundException } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Model } from 'mongoose'
import { Asset } from './schemas/asset.schema'
import { StorageService } from '../../core/storage/storage.service'
import { randomUUID } from 'crypto'

@Injectable()
export class AssetsService {
  constructor(
    @InjectModel(Asset.name) private assetModel: Model<Asset>,
    private storageService: StorageService,
  ) {}

  /**
   * Uploads a file to S3 and creates an asset record.
   * @param file - The file to upload.
   * @returns The created asset.
   */
  async create(file: Express.Multer.File): Promise<Asset> {
    const key = `assets/${randomUUID()}-${file.originalname}`

    await this.storageService.uploadFile(key, file.buffer, file.mimetype)

    const asset = new this.assetModel({
      _id: randomUUID(),
      key,
      originalName: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
    })

    return asset.save()
  }

  /**
   * Finds an asset by ID.
   * @param id - Asset ID.
   * @returns The asset.
   */
  async findOne(id: string): Promise<Asset> {
    const asset = await this.assetModel.findById(id).exec()
    if (!asset) {
      throw new NotFoundException(`Asset with ID ${id} not found`)
    }
    return asset
  }

  /**
   * Deletes an asset from DB and S3.
   * @param id - Asset ID.
   */
  async remove(id: string): Promise<void> {
    const asset = await this.findOne(id)

    // Delete from S3 first (or after, depending on preference for orphans vs dangling refs)
    try {
      await this.storageService.deleteFile(asset.key)
    } catch {
      // Ignore cleanup errors
    }

    await this.assetModel.findByIdAndDelete(id).exec()
  }
}
