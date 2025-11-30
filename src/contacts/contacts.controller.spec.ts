import { Test, TestingModule } from '@nestjs/testing';
import { ContactsController } from './contacts.controller';
import { ContactsService } from './contacts.service';
import { PermissionsGuard } from '../auth/permissions.guard';
import { AuthGuard } from '@nestjs/passport';


describe('ContactsController', () => {
  let controller: ContactsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ContactsController],
      providers: [ContactsService],
    })
      .overrideGuard(PermissionsGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(AuthGuard('jwt'))
      .useValue({ canActivate: () => true })
      .compile()

    controller = module.get<ContactsController>(ContactsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
