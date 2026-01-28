import { Controller, Post, Query, BadRequestException } from '@nestjs/common'
import { ChatwootContactsCron } from './cron/chatwoot-contacts.cron'
import { ChatwootConfigService } from './config/chatwoot-config.service'
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiQuery,
  ApiBearerAuth,
} from '@nestjs/swagger'
import { JwtAuthGuard } from '../../auth/jwt-auth.guard'
import { UseGuards } from '@nestjs/common'

@ApiTags('Chatwoot')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('chatwoot')
export class ChatwootController {
  constructor(
    private readonly cron: ChatwootContactsCron,
    private readonly configService: ChatwootConfigService,
  ) {}

  @ApiOperation({ summary: 'Trigger contact synchronization' })
  @ApiQuery({
    name: 'emails',
    required: false,
    description: 'Comma-separated list of emails to sync',
    example: 'user1@example.com,user2@example.com',
  })
  @ApiResponse({
    status: 201,
    description: 'Sync scheduled successfully',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Scheduled full contact sync' },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Sync disabled via configuration',
  })
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
