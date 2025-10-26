// backend/src/modules/tmdb/tmdb.module.ts 
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TmdbService } from './tmdb.service';
import { TmdbController } from './tmdb.controller';
import { CacheModule } from '../cache/cache.module';

@Module({
  imports: [ConfigModule, CacheModule],
  controllers: [TmdbController],
  providers: [TmdbService],
  exports: [TmdbService],
})
export class TmdbModule {}