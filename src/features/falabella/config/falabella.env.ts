import { IsOptional, IsString } from 'class-validator'

/**
 * Environment variables for Falabella integration.
 * Optional to allow application to start without Falabella configured.
 */
export class FalabellaEnvironmentVariables {
  /**
   * Falabella User ID (Email).
   */
  @IsOptional()
  @IsString()
  FALABELLA_USER_ID?: string

  /**
   * Falabella API Key.
   */
  @IsOptional()
  @IsString()
  FALABELLA_API_KEY?: string

  /**
   * Falabella Seller ID (Optional, inferred from USER_ID if missing, though typically different).
   */
  @IsOptional()
  @IsString()
  FALABELLA_SELLER_ID?: string

  /**
   * Falabella Country Code. (e.g., FACO, FACL, FAPE).
   * Defaults to FACO if not provided.
   */
  @IsOptional()
  @IsString()
  FALABELLA_COUNTRY?: string
}
