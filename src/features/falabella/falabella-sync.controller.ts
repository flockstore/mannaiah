
import { Controller, Post, UseGuards } from '@nestjs/common'
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger'
import { FalabellaSyncService } from './falabella-sync.service'
import { JwtAuthGuard } from '../../auth/jwt-auth.guard'
import { PermissionsGuard } from '../../auth/permissions.guard'
import { RequirePermissions } from '../../auth/permissions.decorator'

@ApiTags('Falabella')
@Controller('falabella')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class FalabellaSyncController {
    constructor(private readonly syncService: FalabellaSyncService) { }

    @Post('sync')
    @RequirePermissions('falabella:sync')
    @ApiOperation({ summary: 'Trigger manual synchronization with Falabella' })
    @ApiResponse({ status: 200, description: 'Sync started successfully' })
    async triggerSync() {
        // Run in background to avoid timeout
        this.syncService.syncProducts().catch(console.error)
        return { message: 'Sync started' }
    }
}
