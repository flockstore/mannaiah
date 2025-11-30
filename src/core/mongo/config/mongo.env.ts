import { IsString, IsOptional } from 'class-validator'

/**
 * Class representing the MongoDB environment variables.
 */
export class MongoEnvironmentVariables {
  /**
   * The connection string for the MongoDB database.
   * Required - application will fail to start if not provided.
   */
  @IsString()
  MANNAIAH_MONGO_URI: string

  /**
   * The name of the MongoDB database.
   * Defaults to 'mannaiah'.
   */
  @IsString()
  @IsOptional()
  MANNAIAH_MONGO_DB_NAME: string = 'mannaiah'
}
