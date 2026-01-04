
import { Injectable, Logger } from '@nestjs/common'
import { createHmac } from 'crypto'
import { FalabellaConfigService } from './config/falabella-config.service'
import { HttpService } from '@nestjs/axios'
import { lastValueFrom } from 'rxjs'

@Injectable()
export class FalabellaService {
  private readonly logger = new Logger(FalabellaService.name)
  private readonly baseUrl = 'https://sellercenter-api.falabella.com'

  constructor(
    private readonly config: FalabellaConfigService,
    private readonly httpService: HttpService,
  ) {
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
      .map(
        (key) =>
          `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`,
      )
      .join('&')

    return createHmac('sha256', apiKey).update(canonicalString).digest('hex')
  }

  /**
   * Tests the connection to Falabella by generating a signature for a dummy action.
   * This doesn't make an HTTP request yet, just verifies we have what we need.
   */
  testConnection(): { success: boolean; message: string } {
    if (!this.config.isConfigured())
      return { success: false, message: 'Disabled' }

    try {
      const dummyParams = {
        Action: 'GetBrands',
        Timestamp: new Date().toISOString(),
        UserID: this.config.userId || '',
        Version: '1.0',
        Format: 'JSON',
      }
      const signature = this.signRequest(dummyParams)
      // Only return part of the signature for security/logging safety if this were real
      return {
        success: true,
        message: `Signature generated: ${signature.substring(0, 10)}...`,
      }
    } catch (error) {
      return { success: false, message: (error as Error).message }
    }
  }

  /**
   * Sends a request to the Falabella API.
   * @param action The API action (e.g., 'ProductCreate')
   * @param params Additional query parameters
   * @param body The request body (for POST requests)
   */
  async sendRequest<T>(
    action: string,
    params: Record<string, string> = {},
    body?: any,
  ): Promise<T> {
    if (!this.config.isConfigured()) {
      throw new Error('Falabella integration is disabled')
    }

    const timestamp = new Date().toISOString()
    const queryParams: Record<string, string> = {
      ...params,
      Action: action,
      Timestamp: timestamp,
      UserID: this.config.userId || '',
      Version: '1.0',
      Format: 'JSON',
    }

    const signature = this.signRequest(queryParams)
    const queryString = new URLSearchParams(queryParams).toString()
    const url = `${this.baseUrl}/?${queryString}&Signature=${signature}`

    try {
      if (body) {
        const response = await lastValueFrom(
          this.httpService.post<T>(url, body),
        )
        return response.data
      } else {
        const response = await lastValueFrom(
          this.httpService.get<T>(url),
        )
        return response.data
      }
    } catch (error) {
      this.logger.error(`Failed to execute Falabella action: ${action}`, error)
      throw error
    }
  }

  async getBrands(): Promise<any> {
    return this.sendRequest('GetBrands')
  }

  async getCategories(): Promise<any> {
    return this.sendRequest('GetCategoryTree')
  }

  async createProduct(payload: any): Promise<any> {
    // Falabella ProductCreate expects XML usually, but we try JSON as per docs/implementation
    // If XML is strictly required we need to convert payload to XML string
    // For now assuming the payload passed is already acceptable or JSON
    return this.sendRequest('ProductCreate', {}, payload)
  }

  async updateProduct(payload: any): Promise<any> {
    return this.sendRequest('ProductUpdate', {}, payload)
  }

  async uploadImage(payload: any): Promise<any> {
    return this.sendRequest('Image', {}, payload)
  }
}
