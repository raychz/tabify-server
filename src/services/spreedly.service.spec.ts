import { Test, TestingModule } from '@nestjs/testing';
import { SpreedlyService } from './spreedly.service';

describe('SpreedlyService', () => {
  let service: SpreedlyService;
  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SpreedlyService],
    }).compile();
    service = module.get<SpreedlyService>(SpreedlyService);
  });
  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
