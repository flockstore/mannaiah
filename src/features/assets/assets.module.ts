import { Module } from '@nestjs/common'
import { MongooseModule } from '@nestjs/mongoose'
import { AssetsService } from './assets.service'
import { AssetsController } from './assets.controller'
import { AssetsRepository } from './assets.repository'
import { Asset, AssetSchema } from './schemas/asset.schema'
import { StorageModule } from '../../core/storage/storage.module'

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Asset.name, schema: AssetSchema }]),
    StorageModule,
  ],
  controllers: [AssetsController],
  providers: [AssetsService, AssetsRepository],
  exports: [AssetsService, AssetsRepository],
})
export class AssetsModule {}
