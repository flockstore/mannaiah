
import { Injectable, Logger } from '@nestjs/common'
import { createHmac } from 'crypto'
import { FalabellaConfigService } from './config/falabella-config.service'
import { HttpService } from '@nestjs/axios'
import { lastValueFrom } from 'rxjs'
import { Builder } from 'xml2js'

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
   * Constructs the required User-Agent header.
   * Format: SELLER_ID/TECNOLOGÍA_USADA/VERSIÓN_TECNOLOGÍA/TIPO_INTEGRACIÓN/CÓDIGO_UNIDAD_DE_NEGOCIO
   */
  get userAgent(): string {
    const sellerId = this.config.sellerId || 'UNKNOWN_SELLER'
    const tech = 'Node' // Changed from NodeJS to Node as per documentation examples
    const version = process.version.replace('v', '')
    const integration = 'PROPIA'
    const country = this.config.country

    return `${sellerId}/${tech}/${version}/${integration}/${country}`
  }

  /**
   * Converts a JavaScript object to XML string.
   */
  private toXml(obj: any): string {
    const builder = new Builder({
      headless: true,
      renderOpts: { pretty: false },
    })
    return builder.buildObject(obj)
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

    const headers: Record<string, string> = {
      'User-Agent': this.userAgent,
    }

    let requestBody = body

    // If body is XML string, set Content-Type
    if (typeof body === 'string' && body.trim().startsWith('<')) {
      headers['Content-Type'] = 'text/xml'
    } else if (body && typeof body === 'object') {
      // Default to JSON if not XML string, but we rely on axios default
      // If we wanted to enforce JSON: headers['Content-Type'] = 'application/json'
    }

    try {
      if (requestBody) {
        const response = await lastValueFrom(
          this.httpService.post<T>(url, requestBody, { headers }),
        )
        return response.data
      } else {
        const response = await lastValueFrom(
          this.httpService.get<T>(url, { headers }),
        )
        return response.data
      }
    } catch (error) {
      this.logger.error(
        `Failed to execute Falabella action: ${action}`,
        error,
      )
      throw error
    }
  }

  async getBrands(): Promise<any> {
    return this.sendRequest('GetBrands')
  }

  async getSeller(): Promise<any> {
    return this.sendRequest('GetSellerByUser')
  }

  async getCategories(): Promise<any> {
    return this.sendRequest('GetCategoryTree')
  }

  async createProduct(payload: any): Promise<any> {
    // Wrap payload in Request -> Product and convert to XML
    const xml = this.toXml({ Request: { Product: payload } })
    return this.sendRequest('ProductCreate', {}, xml)
  }

  async updateProduct(payload: any): Promise<any> {
    // Wrap payload in Request -> Product and convert to XML
    const xml = this.toXml({ Request: { Product: payload } })
    return this.sendRequest('ProductUpdate', {}, xml)
  }

  async uploadImage(payload: any): Promise<any> {
    // Payload usually: { SellerSku: '...', Images: [...] }
    // Falabella Image action expects:
    // <Request><Image><SellerSku>...</SellerSku><Images><Image>url1</Image>...</Images></Image></Request>
    // We need to shape the payload correctly before calling this or do it here.
    // Assuming the caller passes the raw attributes, let's shape it for XML.

    // Check if payload matches XML structure expectation or simplify
    // If payload is { SellerSku, Images: string[] }
    const xmlPayload = {
      Request: {
        Image: {
          SellerSku: payload.SellerSku,
          Images: {
            Image: payload.Images // Builder handles array as multiple tags
          }
        }
      }
    }
    const xml = this.toXml(xmlPayload)
    return this.sendRequest('Image', {}, xml)
  }
}
