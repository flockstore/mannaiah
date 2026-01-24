import { Injectable, Logger, OnModuleInit } from '@nestjs/common'
import { createHmac } from 'crypto'
import axios, { AxiosInstance } from 'axios'
import { FalabellaConfigService } from './config/falabella-config.service'

@Injectable()
export class FalabellaService implements OnModuleInit {
  private readonly logger = new Logger(FalabellaService.name)
  private readonly client: AxiosInstance
  private isEnabled = false

  constructor(private readonly config: FalabellaConfigService) {
    this.client = axios.create({
      baseURL: 'https://sellercenter-api.falabella.com',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    this.setupInterceptors()
  }

  async onModuleInit() {
    if (!this.config.isConfigured()) {
      this.logger.warn('Falabella integration disabled: Missing configuration')
      return
    }

    try {
      this.logger.log('Verifying Falabella connection...')
      const result = await this.testConnection()
      if (result.success) {
        this.isEnabled = true
        this.logger.log('Falabella integration enabled and connected')
      } else {
        this.logger.warn(`Falabella integration disabled: ${result.message}`)
      }
    } catch (error) {
      this.logger.warn(`Falabella integration disabled: Startup verification failed - ${(error as Error).message}`)
    }
  }

  private setupInterceptors() {
    // REQUEST INTERCEPTOR: Signs the request
    this.client.interceptors.request.use(
      (config) => {
        if (!this.config.isConfigured()) {
          return config
        }

        const userId = this.config.userId!
        const apiKey = this.config.apiKey!
        const userAgent = this.config.userAgent || 'Mannaiah/1.0'

        // Set User-Agent / Seller-ID headers
        if (config.headers) {
          config.headers.set('SELLER_ID', userAgent)
          config.headers.set('User-Agent', userAgent)
        }

        // 1. Get current params or initialize
        const params = (config.params || {}) as Record<string, string>

        // 2. Add required system parameters
        params['UserID'] = userId
        params['Version'] = '1.0'
        params['Format'] = 'JSON'
        params['Timestamp'] = new Date().toISOString()

        // 3. Sort parameters by name (key)
        const sortedKeys = Object.keys(params).sort()

        // 4. Build the string to sign
        const canonicalString = sortedKeys
          .map(
            (key) =>
              `${this.rfc3986Encode(key)}=${this.rfc3986Encode(params[key])}`,
          )
          .join('&')

        // 5. Calculate Signature (HMAC-SHA256)
        const signature = createHmac('sha256', apiKey)
          .update(canonicalString)
          .digest('hex')

        // 6. Add Signature to params
        params['Signature'] = signature

        config.params = params
        return config
      },
      (error) => {
        return Promise.reject(error)
      },
    )

    // RESPONSE INTERCEPTOR: Logging
    this.client.interceptors.response.use(
      (response) => {
        this.logger.log(`Falabella Response Status: ${response.status}`)
        return response
      },
      (error) => {
        if (axios.isAxiosError(error)) {
          if (error.response) {
            this.logger.error(`Falabella Error Response: ${error.response.status} - ${JSON.stringify(error.response.data)}`)
          } else if (error.request) {
            this.logger.error('Falabella No Response Received')
          } else {
            this.logger.error(`Falabella Request Setup Error: ${error.message}`)
          }
        }
        return Promise.reject(error)
      },
    )
  }

  /**
   * Encodes a string according to RFC 3986 (simulating PHP's rawurlencode).
   * @param str The string to encode
   */
  private rfc3986Encode(str: string): string {
    return encodeURIComponent(str).replace(/[!'()*]/g, (c) =>
      '%' + c.charCodeAt(0).toString(16).toUpperCase(),
    );
  }

  /**
   * Tests the connection to Falabella by making a real API call.
   */
  async testConnection(): Promise<{ success: boolean; message: string }> {
    if (!this.config.isConfigured())
      return { success: false, message: 'Disabled (Missing UserID or APIKey)' }

    try {
      await this.client.get('/', {
        params: { Action: 'GetBrands' }
      })
      return { success: true, message: 'Connection Successful' }
    } catch (error) {
      let msg = 'Unknown Error';
      if (axios.isAxiosError(error)) {
        msg = error.message;
        if (error.response) msg += ` (${error.response.status})`;
      } else if (error instanceof Error) {
        msg = error.message;
      }
      return { success: false, message: `Connection Failed: ${msg}` }
    }
  }

  /**
   * Helper method for performing checks before business logic
   */
  private checkEnabled() {
    if (!this.isEnabled) {
      throw new Error('Falabella integration is disabled (Configuration or Connection failed)')
    }
  }

  /**
   * Creates or updates products in Falabella.
   * @param product The internal product entity
   */
  async createProduct(product: any): Promise<any> {
    this.checkEnabled();

    // Ideally import Product type, but using any for now to avoid circular dependency issues if they arise, 
    // or better: import the type at top level if not already. 
    // The previous view_file showed Product is in another module.

    // Dynamic import to avoid potential circular deps if Module structure is complex, 
    // but standard import is preferred. I will rely on the property access.

    const { FalabellaMapper } = require('./utils/falabella.mapper'); // lazy load or move import to top

    try {
      const productDTOs = FalabellaMapper.toProductDTOs(product);

      const requestPayload = {
        Product: productDTOs
      };

      // The interceptor handles Action, Timestamp, Signature, etc.
      // But for POST requests, typically Action is a query param OR body param.
      // 'ProductCreate' action is usually sent as a query param `?Action=ProductCreate` 
      // or in the body. The interceptor seems to put everything in `params` (query).
      // Let's follow the interceptor pattern: arguments to `post` are (url, data, config).
      // We pass `Action` in params.

      const response = await this.client.post('/', { Request: requestPayload }, {
        params: {
          Action: 'ProductCreate'
        }
      });

      return response.data;
    } catch (error) {
      this.logger.error(`Failed to create product ${product.sku}`, (error as Error).stack);
      throw error;
    }
  }
}
