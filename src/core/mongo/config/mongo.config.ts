import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { MongoEnvironmentVariables } from './mongo.env'

/**
 * Service to access MongoDB-specific configuration.
 * Uses the main ConfigService to retrieve values.
 */
@Injectable()
export class MongoConfigService {
  constructor(
    private readonly configService: ConfigService<MongoEnvironmentVariables>,
  ) {}

  /**
   * Gets the MongoDB connection URI.
   * @returns The connection URI string.
   * @throws Error if MANNAIAH_MONGO_URI is not defined.
   */
  get uri(): string {
    const uri = this.configService.get('MANNAIAH_MONGO_URI', { infer: true })
    if (uri === undefined) {
      throw new Error('MANNAIAH_MONGO_URI is not defined')
    }
    return uri
  }

  /**
   * Gets the MongoDB database name.
   * @returns The database name string.
   * @throws Error if MANNAIAH_MONGO_DB_NAME is not defined.
   */
  get dbName(): string {
    const dbName = this.configService.get('MANNAIAH_MONGO_DB_NAME', {
      infer: true,
    })
    if (dbName === undefined) {
      throw new Error('MANNAIAH_MONGO_DB_NAME is not defined')
    }
    return dbName
  }
}
