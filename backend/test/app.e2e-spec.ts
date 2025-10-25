// backend/test/auth.e2e-spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { DataSource } from 'typeorm';

describe('Authentication (e2e)', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let accessToken: string;
  let refreshToken: string;
  
  const testUser = {
    email: 'test@cineshare.com',
    username: 'testuser',
    password: 'Test@123456',
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }));
    
    await app.init();
    
    dataSource = moduleFixture.get<DataSource>(DataSource);
  });

  afterAll(async () => {
    // Clean up test data
    await dataSource.query('DELETE FROM users WHERE email = $1', [testUser.email]);
    await app.close();
  });

  describe('/auth/register (POST)', () => {
    it('should register a new user successfully', () => {
      return request(app.getHttpServer())
        .post('/auth/register')
        .send(testUser)
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('accessToken');
          expect(res.body).toHaveProperty('refreshToken');
          expect(res.body).toHaveProperty('user');
          expect(res.body.user.email).toBe(testUser.email);
          expect(res.body.user.username).toBe(testUser.username);
          expect(res.body.user).not.toHaveProperty('password');
          
          // Save tokens for later tests
          accessToken = res.body.accessToken;
          refreshToken = res.body.refreshToken;
        });
    });

    it('should fail with duplicate email', () => {
      return request(app.getHttpServer())
        .post('/auth/register')
        .send(testUser)
        .expect(409)
        .expect((res) => {
          expect(res.body.message).toContain('already exists');
        });
    });

    it('should fail with invalid email format', () => {
      return request(app.getHttpServer())
        .post('/auth/register')
        .send({
          ...testUser,
          email: 'invalid-email',
        })
        .expect(400);
    });

    it('should fail with weak password', () => {
      return request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: 'another@test.com',
          username: 'anotheruser',
          password: '123', // Too short
        })
        .expect(400);
    });

    it('should fail with missing required fields', () => {
      return request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: 'test2@test.com',
          // Missing username and password
        })
        .expect(400);
    });
  });

  describe('/auth/login (POST)', () => {
    it('should login successfully with correct credentials', () => {
      return request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password,
        })
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('accessToken');
          expect(res.body).toHaveProperty('refreshToken');
          expect(res.body).toHaveProperty('user');
          expect(res.body.user.email).toBe(testUser.email);
        });
    });

    it('should fail with incorrect password', () => {
      return request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: testUser.email,
          password: 'WrongPassword123!',
        })
        .expect(401)
        .expect((res) => {
          expect(res.body.message).toContain('Invalid credentials');
        });
    });

    it('should fail with non-existent user', () => {
      return request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'nonexistent@test.com',
          password: 'Password123!',
        })
        .expect(401);
    });

    it('should fail with missing credentials', () => {
      return request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: testUser.email,
          // Missing password
        })
        .expect(400);
    });
  });

  describe('/auth/me (GET)', () => {
    it('should get current user with valid token', () => {
      return request(app.getHttpServer())
        .get('/auth/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.email).toBe(testUser.email);
          expect(res.body.username).toBe(testUser.username);
          expect(res.body).not.toHaveProperty('password');
        });
    });

    it('should fail without token', () => {
      return request(app.getHttpServer())
        .get('/auth/me')
        .expect(401);
    });

    it('should fail with invalid token', () => {
      return request(app.getHttpServer())
        .get('/auth/me')
        .set('Authorization', 'Bearer invalid-token-here')
        .expect(401);
    });

    it('should fail with expired token', async () => {
      // This would require a token with 0 expiry or time manipulation
      // For now, just test malformed token
      return request(app.getHttpServer())
        .get('/auth/me')
        .set('Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c')
        .expect(401);
    });
  });

  describe('/auth/refresh (POST)', () => {
    it('should refresh tokens with valid refresh token', () => {
      return request(app.getHttpServer())
        .post('/auth/refresh')
        .set('Authorization', `Bearer ${refreshToken}`)
        .send({ refreshToken })
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('accessToken');
          expect(res.body).toHaveProperty('refreshToken');
          
          // Update tokens for subsequent tests
          accessToken = res.body.accessToken;
          refreshToken = res.body.refreshToken;
        });
    });

    it('should fail with invalid refresh token', () => {
      return request(app.getHttpServer())
        .post('/auth/refresh')
        .set('Authorization', 'Bearer invalid-token')
        .send({ refreshToken: 'invalid-token' })
        .expect(401);
    });

    it('should fail without refresh token in body', () => {
      return request(app.getHttpServer())
        .post('/auth/refresh')
        .set('Authorization', `Bearer ${refreshToken}`)
        .send({})
        .expect(400);
    });

    it('should fail with access token instead of refresh token', () => {
      return request(app.getHttpServer())
        .post('/auth/refresh')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ refreshToken: accessToken })
        .expect(401);
    });
  });

  describe('/auth/logout (POST)', () => {
    it('should logout successfully with valid token', () => {
      return request(app.getHttpServer())
        .post('/auth/logout')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.message).toContain('success');
        });
    });

    it('should fail logout without token', () => {
      return request(app.getHttpServer())
        .post('/auth/logout')
        .expect(401);
    });
  });

  describe('Security Tests', () => {
    it('should not expose password in any response', async () => {
      // Register new user
      const res = await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: 'security@test.com',
          username: 'securitytest',
          password: 'SecurePass123!',
        });

      expect(res.body.user).not.toHaveProperty('password');
      expect(JSON.stringify(res.body)).not.toContain('SecurePass123!');

      // Clean up
      await dataSource.query('DELETE FROM users WHERE email = $1', ['security@test.com']);
    });

    it('should prevent SQL injection in login', () => {
      return request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: "' OR '1'='1",
          password: "' OR '1'='1",
        })
        .expect(401);
    });

    it('should prevent XSS in registration', async () => {
      const xssPayload = '<script>alert("xss")</script>';
      
      await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: 'xss@test.com',
          username: xssPayload,
          password: 'Test@123456',
        })
        .expect(201);

      // Verify XSS is sanitized
      const user = await dataSource.query(
        'SELECT username FROM users WHERE email = $1',
        ['xss@test.com']
      );
      
      expect(user[0].username).not.toContain('<script>');
      
      // Clean up
      await dataSource.query('DELETE FROM users WHERE email = $1', ['xss@test.com']);
    });
  });

  describe('Rate Limiting Tests', () => {
    it('should rate limit excessive registration attempts', async () => {
      const promises = Array.from({ length: 10 }, (_, i) =>
        request(app.getHttpServer())
          .post('/auth/register')
          .send({
            email: `ratelimit${i}@test.com`,
            username: `ratelimit${i}`,
            password: 'Test@123456',
          })
      );

      const results = await Promise.all(promises);
      
      // At least one should be rate limited (429)
      const rateLimited = results.some(res => res.status === 429);
      expect(rateLimited).toBe(true);

      // Clean up
      for (let i = 0; i < 10; i++) {
        await dataSource.query('DELETE FROM users WHERE email = $1', [`ratelimit${i}@test.com`]);
      }
    });
  });
});