import { Module } from '@nestjs/common'
import { ScheduleModule } from '@nestjs/schedule'
import { AppController } from './app.controller'
import { AppService } from './app.service'
import { CoreModule } from './core/core.module'
import { ContactsModule } from './features/contacts/contacts.module'
import { AuthModule } from './auth/auth.module'
import { WooCommerceModule } from './features/woocommerce/woocommerce.module'

@Module({
  imports: [ScheduleModule.forRoot(), CoreModule, ContactsModule, AuthModule, WooCommerceModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
