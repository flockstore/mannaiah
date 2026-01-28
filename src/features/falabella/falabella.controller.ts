import { Controller, Post, UseGuards } from '@nestjs/common'
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger'
import { FalabellaService } from './falabella.service'

@ApiTags('Falabella')
@Controller('falabella')
export class FalabellaController {
  constructor(private readonly falabellaService: FalabellaService) {}

  @Post('sync')
  @ApiOperation({ summary: 'Sync all products to Falabella' })
  @ApiResponse({
    status: 200,
    description: 'Sync process completed',
    schema: {
      type: 'object',
      properties: {
        total: { type: 'number' },
        success: { type: 'number' },
        failed: { type: 'number' },
        errors: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              sku: { type: 'string' },
              error: { type: 'string' },
            },
          },
        },
      },
    },
  })
  async syncProducts() {
    return this.falabellaService.syncProducts()
  }
}
