import { MongooseModule, MongooseModuleOptions } from '@nestjs/mongoose'
import { MongoMemoryServer } from 'mongodb-memory-server'

/**
 * In-memory MongoDB server instance for testing
 */
let mongoServer: MongoMemoryServer | null = null

/**
 * Create and start an in-memory MongoDB server for testing
 * @returns MongoDB URI for the test server
 */
export async function startMongoMemoryServer(): Promise<string> {
    mongoServer = await MongoMemoryServer.create()
    return mongoServer.getUri()
}

/**
 * Stop the in-memory MongoDB server
 */
export async function stopMongoMemoryServer(): Promise<void> {
    if (mongoServer) {
        await mongoServer.stop()
        mongoServer = null
    }
}

/**
 * Create a test Mongoose module for use in tests
 * @returns MongooseModule configured for testing
 */
export function createTestMongooseModule() {
    return MongooseModule.forRootAsync({
        useFactory: async (): Promise<MongooseModuleOptions> => {
            // If we have a global mongo instance (from global setup), use it
            if (process.env.MONGO_URI) {
                return {
                    uri: process.env.MONGO_URI,
                    retryWrites: false,
                    maxPoolSize: 5,
                }
            }

            // Fallback to local instance (e.g. for single file runs without global setup)
            const uri = await startMongoMemoryServer()
            return {
                uri,
                retryWrites: false,
                maxPoolSize: 5,
            }
        },
    })
}
