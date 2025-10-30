// backend/test/watchlist.e2e-spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';

describe('Watchlist (e2e)', () => {
  let app: INestApplication;
  let authToken: string;
  let watchlistId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    // Register a test user first
    const registerResponse = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email: 'test@example.com',
        password: 'Password123!',
        username: 'testuser',
        displayName: 'Test User',
      });

    console.log('Register response:', registerResponse.status, registerResponse.body);

    // Login to get auth token
    const loginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: 'test@example.com',
        password: 'Password123!',
      });

    console.log('Login response:', loginResponse.status, loginResponse.body);

    authToken = loginResponse.body.accessToken || loginResponse.body.access_token;
    
    if (!authToken) {
      throw new Error('Failed to get auth token. Login response: ' + JSON.stringify(loginResponse.body));
    }
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  describe('/watchlists (POST)', () => {
    it('should create a watchlist', () => {
      return request(app.getHttpServer())
        .post('/watchlists')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Want to Watch',
          description: 'Movies I plan to see',
          isPublic: true,
        })
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('id');
          expect(res.body.name).toBe('Want to Watch');
          watchlistId = res.body.id;
        });
    });
  });

  describe('/watchlists/:id/movies (POST)', () => {
    it('should add a movie to watchlist', () => {
      return request(app.getHttpServer())
        .post(`/watchlists/${watchlistId}/movies`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          movieId: 550,
          notes: 'Must watch!',
        })
        .expect(201);
    });

    it('should prevent duplicate movies', () => {
      return request(app.getHttpServer())
        .post(`/watchlists/${watchlistId}/movies`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          movieId: 550,
        })
        .expect(409);
    });
  });

  describe('/watchlists/:id/toggle-visibility (POST)', () => {
    it('should toggle watchlist visibility', () => {
      return request(app.getHttpServer())
        .post(`/watchlists/${watchlistId}/toggle-visibility`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(201)
        .expect((res) => {
          expect(res.body.isPublic).toBe(false);
        });
    });
  });

  describe('/watchlists (GET)', () => {
    it('should get all user watchlists', () => {
      return request(app.getHttpServer())
        .get('/watchlists')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
          expect(res.body.length).toBeGreaterThan(0);
        });
    });
  });

  describe('/watchlists/:id (GET)', () => {
    it('should get a specific watchlist', () => {
      return request(app.getHttpServer())
        .get(`/watchlists/${watchlistId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.id).toBe(watchlistId);
          expect(res.body.name).toBe('Want to Watch');
        });
    });
  });

  describe('/watchlists/:id (PATCH)', () => {
    it('should update a watchlist', () => {
      return request(app.getHttpServer())
        .patch(`/watchlists/${watchlistId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Updated Watchlist Name',
        })
        .expect(200)
        .expect((res) => {
          expect(res.body.name).toBe('Updated Watchlist Name');
        });
    });
  });

  describe('/watchlists/:id (DELETE)', () => {
    it('should delete a watchlist', () => {
      return request(app.getHttpServer())
        .delete(`/watchlists/${watchlistId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
    });
  });
});