import { Test, TestingModule } from '@nestjs/testing'
import { INestApplication } from '@nestjs/common'
import { FalabellaModule } from '../../src/features/falabella/falabella.module'
import { FalabellaService } from '../../src/features/falabella/falabella.service'
import { FalabellaConfigService } from '../../src/features/falabella/config/falabella-config.service'
import axios from 'axios'

// Mock axios globally
jest.mock('axios')
const mockedAxios = axios as jest.Mocked<typeof axios>

describe('Falabella Integration (Module Level)', () => {
    let app: INestApplication
    let falabellaService: FalabellaService

    // Mock axios instance setup
    const mockInterceptors = {
        request: { use: jest.fn() },
        response: { use: jest.fn() },
    }

    const mockAxiosInstance = {
        interceptors: mockInterceptors,
        get: jest.fn(),
    }

    beforeEach(async () => {
        // Ensure create returns our instance
        mockedAxios.create.mockReturnValue(mockAxiosInstance as any)
        mockedAxios.isAxiosError.mockImplementation((payload) => !!(payload && (payload as any).isAxiosError))

        // We need to control config service BEFORE app.init() is called.
        // Easiest is to set Env vars, but mocking is more precise.
        // Let's use overrideProvider to swap config service with a mock or spyable version?
        // Actually, just creating the module normally but we need to spy on the provider instance 
        // that Nest creates.

        // Alternatively, since we are using imports: [FalabellaModule], we can use .overrideProvider(FalabellaConfigService).useValue(...)
        // But then we lose the real implementation if we want it.
        // Let's stick to Env vars for the module level integration test, 
        // OR better: we can mock get/isConfigured on the prototype? No, dangerous.

        // Let's use overrideProvider with a mock object that delegates?
        // Or simpler: Set process.env
        process.env.FALABELLA_USER_ID = 'test-e2e-startup'
        process.env.FALABELLA_API_KEY = 'test-key'

        // And setup default axios mock success
        mockAxiosInstance.get.mockResolvedValue({ status: 200, data: {} })

        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [FalabellaModule],
            // If we want to strictly control config without env vars:
            // .overrideProvider(FalabellaConfigService)
            // .useValue(mockConfigService)
        }).compile()

        app = moduleFixture.createNestApplication()
        await app.init()

        falabellaService = app.get(FalabellaService)
    })

    afterEach(async () => {
        jest.clearAllMocks()
        await app.close()
    })

    it('FalabellaService should be defined', () => {
        expect(falabellaService).toBeDefined()
    })

    it('onModuleInit should verify connection', async () => {
        // App.init() (checking beforeEach) triggers onModuleInit.
        // We can check if get was called during that phase.
        expect(mockAxiosInstance.get).toHaveBeenCalledTimes(1)
        expect(mockAxiosInstance.get).toHaveBeenCalledWith('/', expect.objectContaining({ params: expect.objectContaining({ Action: 'GetBrands' }) }))
    })

    it('testConnection should return disabled if no env vars are set (default state)', async () => {
        jest.clearAllMocks() // Clear startup call
        const configService = app.get(FalabellaConfigService);
        jest.spyOn(configService, 'isConfigured').mockReturnValue(false);

        const result = await falabellaService.testConnection()
        expect(result.success).toBe(false)
        expect(result.message).toContain('Disabled')
    })

    it('testConnection should try to fetch if we force configuration', async () => {
        jest.clearAllMocks() // Clear startup call
        const configService = app.get(FalabellaConfigService);
        jest.spyOn(configService, 'isConfigured').mockReturnValue(true);
        jest.spyOn(configService, 'userId', 'get').mockReturnValue('e2e-user');
        jest.spyOn(configService, 'apiKey', 'get').mockReturnValue('e2e-key');
        jest.spyOn(configService, 'userAgent', 'get').mockReturnValue('e2e-agent');

        mockAxiosInstance.get.mockResolvedValue({
            status: 200,
            data: { status: 'ok' }
        })

        const result = await falabellaService.testConnection();
        expect(result.success).toBe(true);
        expect(mockAxiosInstance.get).toHaveBeenCalled();

        // In E2E with module isolation and axios mock, we mostly verify logic wiring.
        // The interceptors are registered on the mock.
        const [url, options] = mockAxiosInstance.get.mock.calls[0];
        expect(url).toBe('/'); // baseurl is set in create
        expect(options.params.Action).toBe('GetBrands');
    })
})
