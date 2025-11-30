import { IsEnum, IsNumber, IsString } from 'class-validator'

/**
 * Environment variables for the application core.
 */
export enum Environment {
  Development = 'development',
  Production = 'production',
  Test = 'test',
  Provision = 'provision',
}

/**
 * Class representing the core environment variables.
 */
export class CoreEnvironmentVariables {
  /**
   * The environment the application is running in.
   * Defaults to 'development'.
   */
  @IsEnum(Environment)
  NODE_ENV: Environment = Environment.Development

  /**
   * The port the application will listen on.
   * Defaults to 3000.
   */
  @IsNumber()
  MANNAIAH_PORT: number = 3000

  /**
   * The Logto Issuer URL.
   */
  @IsString()
  LOGTO_ISSUER: string = 'https://test.logto.app'

  /**
   * The Logto Audience.
   */
  @IsString()
  LOGTO_AUDIENCE: string = 'https://api.test.com'
}
