import { Module } from '@nestjs/common'
import { ConfigModule as NestConfigModule } from '@nestjs/config'
import { ConfigService } from './config.service'
import { MongoConfigService } from '../mongo/config/mongo.config'
import { validateUtil } from './validate.util'
import { CoreEnvironmentVariables } from './core.env'
import { MongoEnvironmentVariables } from '../mongo/config/mongo.env'
import { StorageEnvironmentVariables } from '../storage/config/storage.env'

/**
 * Validates the configuration against multiple schemas.
 */
function validate(config: Record<string, unknown>) {
  const coreConfig = validateUtil(CoreEnvironmentVariables, config)
  const mongoConfig = validateUtil(MongoEnvironmentVariables, config)
  const storageConfig = validateUtil(StorageEnvironmentVariables, config)
  return { ...coreConfig, ...mongoConfig, ...storageConfig }
}

@Module({
  imports: [
    NestConfigModule.forRoot({
      validate,
      isGlobal: true, // Make ConfigModule global so we don't need to import it everywhere
    }),
  ],
  providers: [ConfigService, MongoConfigService],
  exports: [ConfigService, MongoConfigService],
})
export class ConfigModule { }
