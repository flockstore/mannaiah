import { Module } from '@nestjs/common'
import { AppController } from './app.controller'
import { AppService } from './app.service'
import { CoreModule } from './core/core.module'
import { ContactsModule } from './features/contacts/contacts.module'
import { AuthModule } from './auth/auth.module'

@Module({
  imports: [CoreModule, ContactsModule, AuthModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
