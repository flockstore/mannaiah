
import { Test, TestingModule } from '@nestjs/testing';
import { FalabellaController } from './falabella.controller';
import { FalabellaService } from './falabella.service';

describe('FalabellaController', () => {
    let controller: FalabellaController;
    let service: FalabellaService;

    const mockFalabellaService = {
        syncProducts: jest.fn(),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [FalabellaController],
            providers: [
                {
                    provide: FalabellaService,
                    useValue: mockFalabellaService,
                },
            ],
        }).compile();

        controller = module.get<FalabellaController>(FalabellaController);
        service = module.get<FalabellaService>(FalabellaService);
    });

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });

    describe('syncProducts', () => {
        it('should call service.syncProducts and return result', async () => {
            const expectedResult = { total: 10, success: 9, failed: 1, errors: [] };
            mockFalabellaService.syncProducts.mockResolvedValue(expectedResult);

            const result = await controller.syncProducts();

            expect(service.syncProducts).toHaveBeenCalled();
            expect(result).toEqual(expectedResult);
        });
    });
});
