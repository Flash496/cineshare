// backend/src/main.ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // ✅ Enable CORS - CRITICAL for frontend to connect
  app.enableCors({
    origin: 'http://localhost:3000', // Your frontend URL
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  // ✅ Use port 3001 (not 3000)
  const port = process.env.PORT || 3001;
  await app.listen(port);
  
  console.log(`Application is running on: http://localhost:${port}`);
}
bootstrap();