import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { validateUtil } from '../../core/config/validate.util'
import { WooCommerceEnvironmentVariables } from './config/woocommerce.env'
import { WooCommerceConfigService } from './config/woocommerce-config.service'
import { WooCommerceApiService } from './services/woocommerce-api.service'

/**
 * WooCommerce feature module
 * Provides WooCommerce REST API integration
 */
@Module({
    imports: [
        ConfigModule.forRoot({
            validate: (config) =>
                validateUtil(WooCommerceEnvironmentVariables, config),
        }),
    ],
    providers: [WooCommerceConfigService, WooCommerceApiService],
    exports: [WooCommerceConfigService, WooCommerceApiService],
})
export class WooCommerceModule { }
