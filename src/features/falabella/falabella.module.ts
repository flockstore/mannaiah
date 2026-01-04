import { Module } from '@nestjs/common'
import { HttpModule } from '@nestjs/axios'
import { ProductsModule } from '../products/products.module'
import { ConfigModule } from '@nestjs/config'
import { validateUtil } from '../../core/config/validate.util'
import { FalabellaEnvironmentVariables } from './config/falabella.env'
import { FalabellaConfigService } from './config/falabella-config.service'
import { FalabellaService } from './falabella.service'
import { FalabellaSyncController } from './falabella-sync.controller'
import { FalabellaSyncService } from './falabella-sync.service'
import { FalabellaSyncCron } from './falabella-sync.cron'

/**
 * Falabella feature module
 * Provides Falabella Seller Center API integration
 */
@Module({
  imports: [
    HttpModule,
    ConfigModule.forRoot({
      validate: (config) => validateUtil(FalabellaEnvironmentVariables, config),
    }),
    ProductsModule,
  ],
  controllers: [FalabellaSyncController],
  providers: [
    FalabellaConfigService,
    FalabellaService,
    FalabellaSyncService,
    FalabellaSyncCron,
  ],
  exports: [FalabellaConfigService, FalabellaService, FalabellaSyncService],
})
export class FalabellaModule { }
