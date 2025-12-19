import { Module } from '@nestjs/common'
import { StorageService } from './storage.service'
import { StorageConfigService } from './config/storage.config'
import { ConfigModule } from '../config/config.module'

/**
 * Module handling file storage operations.
 */
@Module({
    imports: [ConfigModule],
    providers: [StorageService, StorageConfigService],
    exports: [StorageService],
})
export class StorageModule { }
