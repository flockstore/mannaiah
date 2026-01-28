import { Controller, Post, Query, BadRequestException } from '@nestjs/common'
import { ChatwootContactsCron } from './cron/chatwoot-contacts.cron'
import { ChatwootConfigService } from './config/chatwoot-config.service'

@Controller('chatwoot')
export class ChatwootController {
  constructor(
    private readonly cron: ChatwootContactsCron,
    private readonly configService: ChatwootConfigService,
  ) {}

  @Post('sync')
  triggerSync(@Query('emails') emails?: string) {
    if (!this.configService.isSyncEnabled) {
      throw new BadRequestException(
        'Chatwoot sync is disabled via configuration.',
      )
    }

    if (emails) {
      const emailList = emails.split(',').map((e) => e.trim())
      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      this.cron.syncByEmails(emailList)
      return { message: `Scheduled sync for ${emailList.length} contacts` }
    }

    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    this.cron.syncAll()
    return { message: 'Scheduled full contact sync' }
  }
}
