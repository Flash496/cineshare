// backend/src/modules/tmdb/tmdb.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { TmdbService } from './tmdb.service';
import { ConfigService } from '@nestjs/config';
import { CacheService } from '../cache/cache.service';

describe('TmdbService', () => {
  let service: TmdbService;

  const mockConfigService = {
    get: jest.fn((key: string) => {
      if (key === 'TMDB_API_KEY') return 'test-api-key';
      return null;
    }),
  };

  const mockCacheService = {
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TmdbService,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
        {
          provide: CacheService,
          useValue: mockCacheService,
        },
      ],
    }).compile();

    service = module.get<TmdbService>(TmdbService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});