import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { validateUtil } from '../../core/config/validate.util'
import { FalabellaEnvironmentVariables } from './config/falabella.env'
import { FalabellaConfigService } from './config/falabella-config.service'
import { FalabellaService } from './falabella.service'

import { ProductsModule } from '../products/products.module'
import { FalabellaController } from './falabella.controller'

/**
 * Falabella feature module
 * Provides Falabella Seller Center API integration
 */
@Module({
  imports: [
    ConfigModule.forRoot({
      validate: (config) => validateUtil(FalabellaEnvironmentVariables, config),
    }),
    ProductsModule,
  ],
  controllers: [FalabellaController],
  providers: [FalabellaConfigService, FalabellaService],
  exports: [FalabellaConfigService, FalabellaService],
})
export class FalabellaModule {}
