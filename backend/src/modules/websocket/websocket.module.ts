// src/modules/websocket/websocket.module.ts
import { Module } from '@nestjs/common';
import { NotificationGateway } from './notification.gateway';
import { PresenceGateway } from './presence.gateway';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule], // Import AuthModule for JwtService
  providers: [NotificationGateway, PresenceGateway],
  exports: [NotificationGateway, PresenceGateway],
})
export class WebsocketModule {}
