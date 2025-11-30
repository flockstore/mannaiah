import { Module, Global } from '@nestjs/common'
import { MongooseModule as NestMongooseModule } from '@nestjs/mongoose'
import { MongoConfigService } from './config/mongo.config'

/**
 * Global MongoDB module for the application.
 * Configures MongoDB connection using MongoConfigService.
 */
@Global()
@Module({
  imports: [
    NestMongooseModule.forRootAsync({
      inject: [MongoConfigService],
      useFactory: (mongoConfig: MongoConfigService) => ({
        uri: mongoConfig.uri,
        dbName: mongoConfig.dbName,
        // Connection options for production reliability
        retryWrites: true,
        retryReads: true,
        maxPoolSize: 10,
        minPoolSize: 2,
        socketTimeoutMS: 45000,
        serverSelectionTimeoutMS: 5000,
      }),
    }),
  ],
  exports: [NestMongooseModule],
})
export class MongoModule {}
