// test/health.e2e-spec.ts
// Simple test to verify your setup works
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

describe('Health Check (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    prisma = moduleFixture.get<PrismaService>(PrismaService);
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Application Health', () => {
    it('should start the application', () => {
      expect(app).toBeDefined();
    });

    it('should connect to Prisma', () => {
      expect(prisma).toBeDefined();
      expect(prisma.$connect).toBeDefined();
    });

    it('should respond to health check endpoint (if exists)', async () => {
      // Try to hit a basic endpoint
      // Adjust this based on your actual endpoints
      const response = await request(app.getHttpServer())
        .get('/health')
        .expect((res) => {
          // Either 200 (if endpoint exists) or 404 (if not)
          expect([200, 404]).toContain(res.status);
        });
    });
  });

  describe('Database Connection', () => {
    it('should be able to query the database', async () => {
      // Simple query to test database connection
      const result = await prisma.$queryRaw`SELECT 1 as test`;
      expect(result).toBeDefined();
    });
  });
});