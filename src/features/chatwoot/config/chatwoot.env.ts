import { IsBoolean, IsOptional, IsString, IsUrl } from 'class-validator'
import { Transform } from 'class-transformer'

/**
 * Environment variables for Chatwoot integration.
 * Optional to allow application to start without Chatwoot configured.
 */
export class ChatwootEnvironmentVariables {
  /**
   * Chatwoot API URL (e.g., https://app.chatwoot.com).
   */
  @IsOptional()
  @IsUrl()
  CHATWOOT_URL?: string

  /**
   * Chatwoot API Access Token.
   */
  @IsOptional()
  @IsString()
  CHATWOOT_API_KEY?: string

  /**
   * Chatwoot Account ID.
   */
  @IsOptional()
  @IsString()
  CHATWOOT_ACCOUNT_ID?: string

  /**
   * Cron expression for Contact Sync (e.g., "0 0 * * *").
   * Default: Every day at midnight "0 0 * * *".
   */
  @IsOptional()
  @IsString()
  CHATWOOT_CONTACTS_CRON?: string = '0 0 * * *'

  /**
   * Enable/Disable Contact Sync Feature globally.
   */
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  CHATWOOT_CONTACTS_SYNC?: boolean = false
}
