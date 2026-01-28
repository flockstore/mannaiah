import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { HttpModule } from '@nestjs/axios'
import { validateUtil } from '../../core/config/validate.util'
import { ChatwootEnvironmentVariables } from './config/chatwoot.env'
import { ChatwootConfigService } from './config/chatwoot-config.service'
import { ChatwootService } from './chatwoot.service'
import { ContactsModule } from '../contacts/contacts.module'
import { ChatwootContactsCron } from './cron/chatwoot-contacts.cron'
import { ChatwootController } from './chatwoot.controller'

/**
 * Chatwoot feature module
 * Provides Chatwoot Platform API integration
 */
@Module({
  imports: [
    ConfigModule.forRoot({
      validate: (config) => validateUtil(ChatwootEnvironmentVariables, config),
    }),
    HttpModule,
    ContactsModule,
  ],
  controllers: [ChatwootController],
  providers: [ChatwootConfigService, ChatwootService, ChatwootContactsCron],
  exports: [ChatwootConfigService, ChatwootService],
})
export class ChatwootModule {}
