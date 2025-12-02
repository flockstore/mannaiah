import { Module } from '@nestjs/common'
import { ScheduleModule } from '@nestjs/schedule'
import { CoreModule } from './core/core.module'
import { ContactsModule } from './features/contacts/contacts.module'
import { AuthModule } from './auth/auth.module'
import { WooCommerceModule } from './features/woocommerce/woocommerce.module'
import { StatusModule } from './features/status/status.module'

@Module({
  imports: [ScheduleModule.forRoot(), CoreModule, ContactsModule, AuthModule, WooCommerceModule, StatusModule],
  controllers: [],
  providers: [],
})
export class AppModule { }
