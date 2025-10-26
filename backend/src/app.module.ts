import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { ScheduleModule } from '@nestjs/schedule';
import { APP_GUARD } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from './database/database.module';
import { CacheModule } from './modules/cache/cache.module';
import { AuthModule } from './modules/auth/auth.module';
import { PrismaModule } from './prisma/prisma.module';
import { CommonModule } from './common/common.module';
import { JwtAuthGuard } from './modules/auth/guards/jwt-auth.guard';
import { TmdbModule } from './modules/tmdb/tmdb.module';
import { MoviesModule } from './modules/movies/movies.module';
import { ReviewsModule } from './modules/reviews/reviews.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    MongooseModule.forRoot(
      process.env.MONGODB_URI || 'mongodb://localhost:27017/cineshare',
    ),
    ScheduleModule.forRoot(),
    CommonModule,
    PrismaModule,
    DatabaseModule,
    CacheModule,
    AuthModule,
    TmdbModule,
    MoviesModule,
    ReviewsModule, // Added Movies Module
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard, // All routes protected by default
    },
  ],
})
export class AppModule {}
