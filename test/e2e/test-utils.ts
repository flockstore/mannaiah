import { Test, TestingModule, TestingModuleBuilder } from '@nestjs/testing'
import { INestApplication, ValidationPipe } from '@nestjs/common'
import { APP_FILTER } from '@nestjs/core'
import { AllExceptionsFilter } from '../../src/core/filters/all-exceptions.filter'
import { MongoMemoryServer } from 'mongodb-memory-server'
import { AppModule } from '../../src/app.module'
import { JwtAuthGuard } from '../../src/auth/jwt-auth.guard'
import { PermissionsGuard } from '../../src/auth/permissions.guard'
import { StorageService } from '../../src/core/storage/storage.service'

/**
 * Context context for E2E tests.
 */
export interface E2ETestContext {
  app: INestApplication
  mongoServer: MongoMemoryServer
  module: TestingModule
}

/**
 * Creates a NestJS application for E2E testing with:
 * - In-memory MongoDB
 * - Mocked Authentication Guards (JwtAuthGuard, PermissionsGuard)
 * - Mocked StorageService
 * - Global Pipes & Filters (ValidationPipe, AllExceptionsFilter)
 *
 * @param configureModule - Optional callback to override providers/modules.
 * @returns The test context containing app, mongo server, and testing module.
 */
export const createE2EApp = async (
  configureModule?: (builder: TestingModuleBuilder) => TestingModuleBuilder,
): Promise<E2ETestContext> => {
  // 1. Start MongoMemoryServer
  const mongoServer = await MongoMemoryServer.create()
  const uri = mongoServer.getUri()

  // 2. Set Environment Variables
  process.env.MANNAIAH_MONGO_URI = uri
  process.env.MANNAIAH_MONGO_DB_NAME =
    'test_db_' + Math.random().toString(36).substring(7)
  process.env.STORAGE_ENDPOINT = 'http://localhost:9000'
  process.env.STORAGE_REGION = 'us-east-1'
  process.env.STORAGE_BUCKET_NAME = 'test-bucket'
  process.env.LOGTO_ISSUER = 'https://test.logto.app'
  process.env.LOGTO_AUDIENCE = 'https://api.test.com'
  process.env.NODE_ENV = 'test'

  // 3. Mock Standard Providers/Guards
  const mockAuthGuard = { canActivate: jest.fn(() => true) }
  const mockPermissionsGuard = { canActivate: jest.fn(() => true) }
  const mockStorageService = {
    uploadFile: jest
      .fn()
      .mockResolvedValue({ Key: 'test-key', Location: 'test-location' }),
    deleteFile: jest.fn().mockResolvedValue({}),
    getFile: jest.fn().mockResolvedValue({ Body: 'test-content' }),
  }

  // 4. Build Module
  let builder = Test.createTestingModule({
    imports: [AppModule],
    providers: [
      {
        provide: APP_FILTER,
        useClass: AllExceptionsFilter,
      },
    ],
  })
    .overrideGuard(JwtAuthGuard)
    .useValue(mockAuthGuard)
    .overrideGuard(PermissionsGuard)
    .useValue(mockPermissionsGuard)
    .overrideProvider(StorageService)
    .useValue(mockStorageService)

  // Allow custom overrides (e.g. specialized mocks)
  if (configureModule) {
    builder = configureModule(builder)
  }

  const module = await builder.compile()

  const app = module.createNestApplication()

  app.useGlobalPipes(new ValidationPipe({ transform: true }))
  app.useGlobalFilters(new AllExceptionsFilter())

  await app.init()

  return { app, mongoServer, module }
}

/**
 * Closes the E2E test application and stops the in-memory MongoDB.
 * @param context - The test context to close.
 */
export const closeE2EApp = async (context: E2ETestContext) => {
  await context.app.close()
  await context.mongoServer.stop()
}
