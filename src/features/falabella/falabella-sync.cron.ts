
import { Injectable, Logger } from '@nestjs/common'
import { Cron, CronExpression } from '@nestjs/schedule'
import { FalabellaSyncService } from './falabella-sync.service'
import { FalabellaConfigService } from './config/falabella-config.service'

@Injectable()
export class FalabellaSyncCron {
    private readonly logger = new Logger(FalabellaSyncCron.name)

    constructor(
        private readonly syncService: FalabellaSyncService,
        private readonly config: FalabellaConfigService,
    ) { }

    @Cron(CronExpression.EVERY_HOUR)
    async handleCron() {
        if (!this.config.isConfigured()) {
            return
        }
        this.logger.log('Running scheduled Falabella sync')
        await this.syncService.syncProducts()
    }
}
