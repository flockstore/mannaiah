import { Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Model } from 'mongoose'
import { BaseRepository } from '../../core/mongo/repositories/base.repository'
import { Asset, AssetDocument } from './schemas/asset.schema'

@Injectable()
export class AssetsRepository extends BaseRepository<AssetDocument> {
  constructor(
    @InjectModel(Asset.name) private assetModel: Model<AssetDocument>,
  ) {
    super(assetModel)
  }
}
