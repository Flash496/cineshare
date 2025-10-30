// backend/src/modules/watchlist/watchlist.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { WatchlistService } from './watchlist.service';
import { PrismaService } from '../../prisma/prisma.service';
import { NotFoundException, ForbiddenException, ConflictException } from '@nestjs/common';

describe('WatchlistService', () => {
  let service: WatchlistService;
  let prisma: PrismaService;

  const mockPrismaService = {
    watchlist: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    watchlistMovie: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      delete: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WatchlistService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<WatchlistService>(WatchlistService);
    prisma = module.get<PrismaService>(PrismaService);

    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a watchlist successfully', async () => {
      const userId = 'user-123';
      const dto = {
        name: 'Want to Watch',
        description: 'Movies I want to see',
        isPublic: true,
      };

      const mockWatchlist = {
        id: 'watchlist-123',
        ...dto,
        userId,
        createdAt: new Date(),
        updatedAt: new Date(),
        _count: { movies: 0 },
      };

      mockPrismaService.watchlist.create.mockResolvedValue(mockWatchlist);

      const result = await service.create(userId, dto);

      expect(result.name).toBe(dto.name);
      expect(result.userId).toBe(userId);
      expect(mockPrismaService.watchlist.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId,
          name: dto.name,
          description: dto.description,
          isPublic: dto.isPublic,
        }),
        include: expect.any(Object),
      });
    });

    it('should create a watchlist with default settings', async () => {
      const userId = 'user-123';
      const dto = {
        name: 'My Private List',
      };

      const mockWatchlist = {
        id: 'watchlist-123',
        name: dto.name,
        description: null,
        isPublic: true, // Updated to match actual service behavior
        userId,
        createdAt: new Date(),
        updatedAt: new Date(),
        _count: { movies: 0 },
      };

      mockPrismaService.watchlist.create.mockResolvedValue(mockWatchlist);

      const result = await service.create(userId, dto);

      expect(result.name).toBe(dto.name);
      expect(mockPrismaService.watchlist.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId,
          name: dto.name,
        }),
        include: expect.any(Object),
      });
    });
  });

  describe('findAll', () => {
    it('should return all watchlists for a user', async () => {
      const userId = 'user-123';
      const mockWatchlists = [
        {
          id: 'wl-1',
          name: 'Favorites',
          userId,
          _count: { movies: 5 },
        },
        {
          id: 'wl-2',
          name: 'To Watch',
          userId,
          _count: { movies: 3 },
        },
      ];

      mockPrismaService.watchlist.findMany.mockResolvedValue(mockWatchlists);

      const result = await service.findAll(userId);

      expect(result).toHaveLength(2);
      expect(result[0].name).toBe('Favorites');
      expect(mockPrismaService.watchlist.findMany).toHaveBeenCalledWith({
        where: { userId },
        include: expect.any(Object),
        orderBy: { createdAt: 'desc' },
      });
    });

    it('should return empty array if user has no watchlists', async () => {
      mockPrismaService.watchlist.findMany.mockResolvedValue([]);

      const result = await service.findAll('user-123');

      expect(result).toEqual([]);
    });
  });

  describe('findOne', () => {
    it('should return a watchlist if user owns it', async () => {
      const userId = 'user-123';
      const watchlistId = 'watchlist-123';

      const mockWatchlist = {
        id: watchlistId,
        name: 'My List',
        userId,
        isPublic: false,
        movies: [],
      };

      mockPrismaService.watchlist.findUnique.mockResolvedValue(mockWatchlist);

      const result = await service.findOne(watchlistId, userId);

      expect(result.id).toBe(watchlistId);
      expect(result.userId).toBe(userId);
    });

    it('should return public watchlist even if not owner', async () => {
      const watchlistId = 'watchlist-123';
      const ownerId = 'owner-123';
      const viewerId = 'viewer-456';

      const mockWatchlist = {
        id: watchlistId,
        name: 'Public List',
        userId: ownerId,
        isPublic: true,
        movies: [],
      };

      mockPrismaService.watchlist.findUnique.mockResolvedValue(mockWatchlist);

      const result = await service.findOne(watchlistId, viewerId);

      expect(result.id).toBe(watchlistId);
      expect(result.isPublic).toBe(true);
    });

    it('should throw NotFoundException if watchlist does not exist', async () => {
      mockPrismaService.watchlist.findUnique.mockResolvedValue(null);

      await expect(
        service.findOne('non-existent', 'user-123')
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if watchlist is private and user is not owner', async () => {
      const mockWatchlist = {
        id: 'watchlist-123',
        userId: 'owner-123',
        isPublic: false,
      };

      mockPrismaService.watchlist.findUnique.mockResolvedValue(mockWatchlist);

      await expect(
        service.findOne('watchlist-123', 'other-user')
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('addMovie', () => {
    it('should add a movie to watchlist successfully', async () => {
      const userId = 'user-123';
      const watchlistId = 'watchlist-123';
      const dto = { movieId: 550, notes: 'Great movie!' };

      mockPrismaService.watchlist.findUnique.mockResolvedValue({
        id: watchlistId,
        userId,
        movies: [],
      });

      mockPrismaService.watchlistMovie.findUnique.mockResolvedValue(null);
      mockPrismaService.watchlistMovie.count.mockResolvedValue(0);

      mockPrismaService.watchlistMovie.create.mockResolvedValue({
        id: 'wm-123',
        watchlistId,
        movieId: 550,
        order: 0,
        notes: dto.notes,
        addedAt: new Date(),
      });

      const result = await service.addMovie(userId, watchlistId, dto);

      expect(result.message).toBe('Movie added to watchlist');
      expect(mockPrismaService.watchlistMovie.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          watchlistId,
          movieId: dto.movieId,
          notes: dto.notes,
        }),
      });
    });

    it('should throw ConflictException if movie already in watchlist', async () => {
      mockPrismaService.watchlist.findUnique.mockResolvedValue({
        userId: 'user-123',
      });

      mockPrismaService.watchlistMovie.findUnique.mockResolvedValue({
        id: 'existing',
        movieId: 550,
      });

      await expect(
        service.addMovie('user-123', 'watchlist-123', { movieId: 550 })
      ).rejects.toThrow(ConflictException);
    });

    it('should throw NotFoundException if watchlist does not exist', async () => {
      mockPrismaService.watchlist.findUnique.mockResolvedValue(null);

      await expect(
        service.addMovie('user-123', 'non-existent', { movieId: 550 })
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if user does not own watchlist', async () => {
      mockPrismaService.watchlist.findUnique.mockResolvedValue({
        id: 'watchlist-123',
        userId: 'other-user',
      });

      await expect(
        service.addMovie('user-123', 'watchlist-123', { movieId: 550 })
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('removeMovie', () => {
    it('should remove a movie from watchlist', async () => {
      const userId = 'user-123';
      const watchlistId = 'watchlist-123';
      const movieId = 550;

      mockPrismaService.watchlist.findUnique.mockResolvedValue({
        id: watchlistId,
        userId,
      });

      mockPrismaService.watchlistMovie.findUnique.mockResolvedValue({
        id: 'wm-123',
        watchlistId,
        movieId,
      });

      mockPrismaService.watchlistMovie.delete.mockResolvedValue({});

      const result = await service.removeMovie(userId, watchlistId, movieId);

      expect(result.message).toBe('Movie removed from watchlist');
      expect(mockPrismaService.watchlistMovie.delete).toHaveBeenCalled();
    });

    it('should throw NotFoundException if movie not in watchlist', async () => {
      mockPrismaService.watchlist.findUnique.mockResolvedValue({
        userId: 'user-123',
      });

      mockPrismaService.watchlistMovie.findUnique.mockResolvedValue(null);

      await expect(
        service.removeMovie('user-123', 'watchlist-123', 550)
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('reorderMovies', () => {
    it('should reorder movies successfully', async () => {
      const userId = 'user-123';
      const watchlistId = 'watchlist-123';
      const movieOrders = [
        { movieId: 550, order: 0 },
        { movieId: 551, order: 1 },
      ];

      mockPrismaService.watchlist.findUnique.mockResolvedValue({
        id: watchlistId,
        userId,
      });

      mockPrismaService.watchlistMovie.findMany.mockResolvedValue([
        { movieId: 550 },
        { movieId: 551 },
      ]);

      mockPrismaService.$transaction.mockResolvedValue([]);

      const result = await service.reorderMovies(userId, watchlistId, movieOrders);

      expect(result.message).toBe('Watchlist reordered successfully');
      expect(mockPrismaService.$transaction).toHaveBeenCalled();
    });

    it('should throw BadRequestException if movie not in watchlist during reorder', async () => {
      const userId = 'user-123';
      const watchlistId = 'watchlist-123';
      
      mockPrismaService.watchlist.findUnique.mockResolvedValue({
        id: watchlistId,
        userId,
      });

      // Only movie 550 exists in watchlist
      mockPrismaService.watchlistMovie.findMany.mockResolvedValue([
        { movieId: 550 },
      ]);

      // Try to reorder with movie 999 which doesn't exist
      await expect(
        service.reorderMovies('user-123', 'watchlist-123', [
          { movieId: 550, order: 0 },
          { movieId: 999, order: 1 },
        ])
      ).rejects.toThrow('Some movies not found in watchlist');
    });
  });

  describe('update', () => {
    it('should update watchlist successfully', async () => {
      const userId = 'user-123';
      const watchlistId = 'watchlist-123';
      const dto = { name: 'Updated Name', isPublic: false };

      mockPrismaService.watchlist.findUnique.mockResolvedValue({
        id: watchlistId,
        userId,
      });

      mockPrismaService.watchlist.update.mockResolvedValue({
        id: watchlistId,
        ...dto,
        userId,
      });

      const result = await service.update(watchlistId, userId, dto);

      expect(result.name).toBe(dto.name);
      expect(mockPrismaService.watchlist.update).toHaveBeenCalledWith({
        where: { id: watchlistId },
        data: dto,
        include: expect.any(Object),
      });
    });
  });

  describe('remove', () => {
    it('should delete watchlist successfully', async () => {
      const userId = 'user-123';
      const watchlistId = 'watchlist-123';

      mockPrismaService.watchlist.findUnique.mockResolvedValue({
        id: watchlistId,
        userId,
      });

      mockPrismaService.watchlist.delete.mockResolvedValue({});

      const result = await service.remove(watchlistId, userId);

      expect(result.message).toBe('Watchlist deleted successfully');
      expect(mockPrismaService.watchlist.delete).toHaveBeenCalledWith({
        where: { id: watchlistId },
      });
    });
  });

  describe('toggleVisibility', () => {
    it('should toggle watchlist from private to public', async () => {
      const userId = 'user-123';
      const watchlistId = 'watchlist-123';

      mockPrismaService.watchlist.findUnique.mockResolvedValue({
        id: watchlistId,
        userId,
        isPublic: false,
      });

      mockPrismaService.watchlist.update.mockResolvedValue({
        id: watchlistId,
        userId,
        isPublic: true,
      });

      const result = await service.toggleVisibility(watchlistId, userId);

      expect(result.isPublic).toBe(true);
    });

    it('should toggle watchlist from public to private', async () => {
      mockPrismaService.watchlist.findUnique.mockResolvedValue({
        userId: 'user-123',
        isPublic: true,
      });

      mockPrismaService.watchlist.update.mockResolvedValue({
        isPublic: false,
      });

      const result = await service.toggleVisibility('watchlist-123', 'user-123');

      expect(result.isPublic).toBe(false);
    });
  });
});