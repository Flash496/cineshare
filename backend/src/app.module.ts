import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from './database/database.module';
import { CacheModule } from './cache/cache.module';
import { AuthModule } from './modules/auth/auth.module';

@Module({
  imports: [DatabaseModule, CacheModule, AuthModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
