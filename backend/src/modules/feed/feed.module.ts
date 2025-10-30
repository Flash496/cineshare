// backend/src/modules/feed/feed.module.ts
import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { FeedService } from './feed.service';
import { FeedController } from './feed.controller';
import { FeedGateway } from './feed.gateway';
import { Activity, ActivitySchema } from '../../schemas/activity.schema';
import { CacheModule } from '../cache/cache.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Activity.name, schema: ActivitySchema },
    ]),
    CacheModule,
    forwardRef(() => AuthModule), // Import AuthModule for JWT
  ],
  controllers: [FeedController],
  providers: [FeedService, FeedGateway],
  exports: [FeedService, FeedGateway],
})
export class FeedModule {}