import { Module } from '@nestjs/common'
import { ScheduleModule } from '@nestjs/schedule'
import { CoreModule } from './core/core.module'
import { ContactsModule } from './features/contacts/contacts.module'
import { AuthModule } from './auth/auth.module'
import { WooCommerceModule } from './features/woocommerce/woocommerce.module'
import { StatusModule } from './features/status/status.module'
import { ProductsModule } from './features/products/products.module'
import { AssetsModule } from './features/assets/assets.module'
import { VariationsModule } from './features/variations/variations.module'

@Module({
  imports: [
    ScheduleModule.forRoot(),
    CoreModule,
    ContactsModule,
    AuthModule,
    WooCommerceModule,
    StatusModule,
    ProductsModule,
    AssetsModule,
    VariationsModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
