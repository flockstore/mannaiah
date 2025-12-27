
import { Injectable, Logger } from '@nestjs/common'
import { createHmac } from 'crypto'
import { FalabellaConfigService } from './config/falabella-config.service'

@Injectable()
export class FalabellaService {
    private readonly logger = new Logger(FalabellaService.name)

    constructor(private readonly config: FalabellaConfigService) {
        if (this.config.isConfigured()) {
            this.logger.log('Falabella integration is enabled')
        }
    }

    /**
     * Generates the HMAC-SHA256 signature required by Falabella API.
     * @param params The request parameters (Action, Timestamp, etc.)
     * @returns The hex-encoded signature string
     */
    signRequest(params: Record<string, string>): string {
        if (!this.config.isConfigured()) {
            throw new Error('Falabella integration is disabled')
        }

        const apiKey = this.config.apiKey
        if (!apiKey) {
            throw new Error('Falabella API Key is missing')
        }

        // 1. Sort parameters by key
        const sortedKeys = Object.keys(params).sort()

        // 2. Concatenate "parameter=value" pairs associated to the sorted keys (URL encoded)
        const canonicalString = sortedKeys
            .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`)
            .join('&')

        return createHmac('sha256', apiKey)
            .update(canonicalString)
            .digest('hex')
    }

    /**
     * Tests the connection to Falabella by generating a signature for a dummy action.
     * This doesn't make an HTTP request yet, just verifies we have what we need.
     */
    testConnection(): { success: boolean; message: string } {
        if (!this.config.isConfigured()) return { success: false, message: 'Disabled' }

        try {
            const dummyParams = {
                'Action': 'GetBrands',
                'Timestamp': new Date().toISOString(),
                'UserID': this.config.userId || '',
                'Version': '1.0',
                'Format': 'JSON'
            }
            const signature = this.signRequest(dummyParams)
            // Only return part of the signature for security/logging safety if this were real
            return { success: true, message: `Signature generated: ${signature.substring(0, 10)}...` }
        } catch (error) {
            return { success: false, message: (error as Error).message }
        }
    }
}
