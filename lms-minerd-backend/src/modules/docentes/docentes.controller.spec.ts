import { Test, TestingModule } from '@nestjs/testing';
import { DocentesController } from './docentes.controller';

describe('DocentesController', () => {
  let controller: DocentesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DocentesController],
    }).compile();

    controller = module.get<DocentesController>(DocentesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
