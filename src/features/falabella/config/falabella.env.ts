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
}
