// backend/src/modules/reviews/reviews.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { ReviewsService } from './reviews.service';
import { PrismaService } from '../../prisma/prisma.service';
import { ConflictException, NotFoundException, ForbiddenException } from '@nestjs/common';

describe('ReviewsService', () => {
  let service: ReviewsService;
  let prisma: PrismaService;

  const mockPrismaService = {
    review: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      aggregate: jest.fn(),
      groupBy: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReviewsService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<ReviewsService>(ReviewsService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    const userId = 'user-123';
    const createDto = {
      movieId: 550,
      rating: 9.5,
      title: 'Great movie',
      content: 'This is a fantastic film with amazing performances.',
      hasSpoilers: false,
    };

    it('should create a review successfully', async () => {
      mockPrismaService.review.findUnique.mockResolvedValue(null);
      mockPrismaService.review.create.mockResolvedValue({
        id: 'review-123',
        ...createDto,
        userId,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await service.create(userId, createDto);

      expect(result).toHaveProperty('id');
      expect(result.movieId).toBe(550);
      expect(mockPrismaService.review.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId,
          movieId: 550,
          rating: 9.5,
        }),
        include: expect.any(Object),
      });
    });

    it('should throw ConflictException if review already exists', async () => {
      mockPrismaService.review.findUnique.mockResolvedValue({
        id: 'existing-review',
        userId,
        movieId: 550,
      });

      await expect(service.create(userId, createDto)).rejects.toThrow(
        ConflictException
      );
      expect(mockPrismaService.review.create).not.toHaveBeenCalled();
    });

    it('should validate rating is within 0-10 range', async () => {
      const invalidDto = { ...createDto, rating: 11 };

      await expect(service.create(userId, invalidDto)).rejects.toThrow();
    });
  });

  describe('findByMovie', () => {
    it('should return paginated reviews for a movie', async () => {
      const movieId = 550;
      const mockReviews = [
        { id: 'review-1', movieId, rating: 9 },
        { id: 'review-2', movieId, rating: 8 },
      ];

      mockPrismaService.review.findMany.mockResolvedValue(mockReviews);
      mockPrismaService.review.count.mockResolvedValue(2);

      const result = await service.findByMovie(movieId, 1, 10);

      expect(result.reviews).toHaveLength(2);
      expect(result.pagination).toEqual({
        page: 1,
        limit: 10,
        total: 2,
        pages: 1,
      });
    });
  });

  describe('update', () => {
    const userId = 'user-123';
    const reviewId = 'review-123';
    const updateDto = { rating: 10, content: 'Updated review' };

    it('should update review successfully', async () => {
      mockPrismaService.review.findUnique.mockResolvedValue({
        id: reviewId,
        userId,
      });
      mockPrismaService.review.update.mockResolvedValue({
        id: reviewId,
        ...updateDto,
      });

      const result = await service.update(reviewId, userId, updateDto);

      expect(result.rating).toBe(10);
      expect(mockPrismaService.review.update).toHaveBeenCalled();
    });

    it('should throw NotFoundException if review does not exist', async () => {
      mockPrismaService.review.findUnique.mockResolvedValue(null);

      await expect(
        service.update(reviewId, userId, updateDto)
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if user is not owner', async () => {
      mockPrismaService.review.findUnique.mockResolvedValue({
        id: reviewId,
        userId: 'different-user',
      });

      await expect(
        service.update(reviewId, userId, updateDto)
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('remove', () => {
    const userId = 'user-123';
    const reviewId = 'review-123';

    it('should delete review successfully', async () => {
      mockPrismaService.review.findUnique.mockResolvedValue({
        id: reviewId,
        userId,
      });
      mockPrismaService.review.delete.mockResolvedValue({});

      const result = await service.remove(reviewId, userId);

      expect(result.message).toBe('Review deleted successfully');
      expect(mockPrismaService.review.delete).toHaveBeenCalledWith({
        where: { id: reviewId },
      });
    });
  });

  describe('getMovieStats', () => {
    it('should return correct movie statistics', async () => {
      const movieId = 550;
      mockPrismaService.review.aggregate.mockResolvedValue({
        _avg: { rating: 8.5 },
        _count: { rating: 100 },
      });
      mockPrismaService.review.groupBy.mockResolvedValue([
        { rating: 10, _count: { rating: 20 } },
        { rating: 9, _count: { rating: 30 } },
      ]);

      const result = await service.getMovieStats(movieId);

      expect(result.averageRating).toBe(8.5);
      expect(result.totalReviews).toBe(100);
      expect(result.ratingDistribution).toHaveLength(2);
    });
  });
});