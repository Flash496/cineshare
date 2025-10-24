import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from './database/database.module';
import { CacheModule } from './cache/cache.module';

@Module({
  imports: [DatabaseModule, CacheModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
