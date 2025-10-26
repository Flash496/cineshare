// backend/src/modules/tmdb/tmdb.service.ts
import { Injectable, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance, AxiosError } from 'axios';
import axiosRetry from 'axios-retry';
import * as https from 'https';
import { CacheService } from '../cache/cache.service';

@Injectable()
export class TmdbService {
  private axiosInstance: AxiosInstance;
  private readonly apiKey: string;
  private readonly baseUrl = 'https://api.themoviedb.org/3';
  private readonly logger = new Logger(TmdbService.name);

  constructor(
    private configService: ConfigService,
    private readonly cacheService: CacheService,
  ) {
    const apiKey = this.configService.get<string>('TMDB_API_KEY');
    
    if (!apiKey) {
      throw new Error('TMDB_API_KEY is not defined in environment variables');
    }

    this.apiKey = apiKey;
    this.logger.log(`TMDB API Key loaded: ${apiKey.substring(0, 8)}...`);

    // Create axios instance with better configuration
    this.axiosInstance = axios.create({
      baseURL: this.baseUrl,
      params: {
        api_key: this.apiKey,
      },
      timeout: 30000, // Increased to 30 seconds
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      // Add HTTPS agent with keep-alive
      httpsAgent: new https.Agent({
        keepAlive: true,
        keepAliveMsecs: 1000,
        maxSockets: 50,
        maxFreeSockets: 10,
        timeout: 30000,
      }),
    });

    // Configure retry logic for network errors
    axiosRetry(this.axiosInstance, {
  retries: 3,
  retryDelay: axiosRetry.exponentialDelay,
  retryCondition: (error) => {
    return (
      axiosRetry.isNetworkOrIdempotentRequestError(error) ||
      error.code === 'ECONNRESET' ||
      error.code === 'ETIMEDOUT' ||
      error.code === 'ENOTFOUND' ||
      error.code === 'ECONNREFUSED' ||
      (error.response?.status ?? 0) >= 500 // ✅ Added nullish coalescing
    );
  },
  onRetry: (retryCount, error, requestConfig) => {
    this.logger.warn(
      `Retry attempt ${retryCount} for ${requestConfig.url} - Error: ${error.code || error.message}`
    );
  },
});

    // Request interceptor
    this.axiosInstance.interceptors.request.use(
      (config) => {
        this.logger.debug(`TMDB Request: ${config.method?.toUpperCase()} ${config.url}`);
        return config;
      },
      (error) => {
        this.logger.error('TMDB Request Error:', error);
        return Promise.reject(error);
      }
    );

    // Response interceptor
    this.axiosInstance.interceptors.response.use(
      (response) => {
        this.logger.debug(`TMDB Response: ${response.status} ${response.config.url}`);
        return response;
      },
      (error) => {
        this.handleAxiosError(error);
        return Promise.reject(error);
      }
    );
  }

  private handleAxiosError(error: AxiosError) {
  if (error.code === 'ECONNRESET') {
    this.logger.error('Connection reset by TMDB API - Possible network instability or rate limiting');
  } else if (error.code === 'ETIMEDOUT') {
    this.logger.error('Request timeout - TMDB API took too long to respond');
  } else if (error.code === 'ENOTFOUND') {
    this.logger.error('DNS lookup failed - Cannot resolve TMDB API hostname');
  } else if (error.code === 'ECONNREFUSED') {
    this.logger.error('Connection refused - TMDB API is not accepting connections');
  } else if (error.response) {
    this.logger.error(`TMDB API Error: ${error.response.status} - ${JSON.stringify(error.response.data)}`);
  } else if (error.request) {
    this.logger.error('TMDB API No Response:', error.message);
  } else {
    this.logger.error('TMDB API Error:', error.message);
  }
}

  private handleError(operation: string, error: any): never {
  const axiosError = error as AxiosError;
  
  // Provide more specific error messages for common issues
  let message: string;
  
  if (axiosError.code === 'ECONNRESET') {
    message = 'Connection to TMDB API was reset. Please try again.';
  } else if (axiosError.code === 'ETIMEDOUT') {
    message = 'Request to TMDB API timed out. Please try again.';
  } else if (axiosError.code === 'ENOTFOUND') {
    message = 'Unable to reach TMDB API. Please check your internet connection.';
  } else {
    message = axiosError.response?.data?.['status_message'] || 
              axiosError.message || 
              `Failed to ${operation}`;
  }
  
  const status = axiosError.response?.status || HttpStatus.BAD_REQUEST; // ✅ Added optional chaining
  
  this.logger.error(`Error in ${operation}:`, {
    code: axiosError.code,
    status,
    message,
    data: axiosError.response?.data,
  });

  throw new HttpException(
    message, 
    status === 404 ? HttpStatus.NOT_FOUND : HttpStatus.BAD_REQUEST
  );
}

  async searchMovies(query: string, page: number = 1) {
    const cacheKey = `search:${query}:${page}`;

    try {
      const cachedResults = await this.cacheService.get(cacheKey);
      if (cachedResults) {
        this.logger.debug(`Cache hit for search: ${query}`);
        return cachedResults;
      }

      const response = await this.axiosInstance.get('/search/movie', {
        params: { 
          query, 
          page,
          include_adult: false,
        },
      });

      await this.cacheService.set(cacheKey, response.data, 3600);
      this.logger.debug(`Cached search: ${query}`);

      return response.data;
    } catch (error) {
      this.handleError('search movies', error);
    }
  }

  async getMovieDetails(movieId: number) {
    const cacheKey = `movie:${movieId}`;

    try {
      const cachedMovie = await this.cacheService.get(cacheKey);
      if (cachedMovie) {
        this.logger.debug(`Cache hit for movie: ${movieId}`);
        return cachedMovie;
      }

      const response = await this.axiosInstance.get(`/movie/${movieId}`, {
        params: {
          append_to_response: 'credits,videos,images,similar,keywords,reviews',
        },
      });

      await this.cacheService.set(cacheKey, response.data, 86400);
      this.logger.debug(`Cached movie: ${movieId}`);

      return response.data;
    } catch (error) {
      this.handleError(`fetch movie details for ${movieId}`, error);
    }
  }

  async getTrendingMovies(timeWindow: 'day' | 'week' = 'week', page: number = 1) {
    const cacheKey = `trending:${timeWindow}:${page}`;

    try {
      const cachedResults = await this.cacheService.get(cacheKey);
      if (cachedResults) {
        this.logger.debug(`Cache hit for trending: ${timeWindow}`);
        return cachedResults;
      }

      this.logger.log(`Fetching trending movies: ${timeWindow}, page: ${page}`);

      const response = await this.axiosInstance.get(
        `/trending/movie/${timeWindow}`,
        {
          params: { page },
        }
      );

      await this.cacheService.set(cacheKey, response.data, 21600);
      this.logger.log(`Successfully fetched and cached trending movies`);

      return response.data;
    } catch (error) {
      this.logger.error(`Trending movies error:`, {
        code: error.code,
        message: error.message,
      });
      this.handleError('fetch trending movies', error);
    }
  }

  async getPopularMovies(page: number = 1) {
    const cacheKey = `popular:${page}`;

    try {
      const cachedResults = await this.cacheService.get(cacheKey);
      if (cachedResults) {
        this.logger.debug(`Cache hit for popular movies`);
        return cachedResults;
      }

      const response = await this.axiosInstance.get('/movie/popular', {
        params: { page },
      });

      await this.cacheService.set(cacheKey, response.data, 43200);

      return response.data;
    } catch (error) {
      this.handleError('fetch popular movies', error);
    }
  }

  async getTopRatedMovies(page: number = 1) {
    const cacheKey = `top_rated:${page}`;

    try {
      const cachedResults = await this.cacheService.get(cacheKey);
      if (cachedResults) {
        return cachedResults;
      }

      const response = await this.axiosInstance.get('/movie/top_rated', {
        params: { page },
      });

      await this.cacheService.set(cacheKey, response.data, 43200);

      return response.data;
    } catch (error) {
      this.handleError('fetch top rated movies', error);
    }
  }

  async getUpcomingMovies(page: number = 1) {
    const cacheKey = `upcoming:${page}`;

    try {
      const cachedResults = await this.cacheService.get(cacheKey);
      if (cachedResults) {
        return cachedResults;
      }

      const response = await this.axiosInstance.get('/movie/upcoming', {
        params: { page },
      });

      await this.cacheService.set(cacheKey, response.data, 21600);

      return response.data;
    } catch (error) {
      this.handleError('fetch upcoming movies', error);
    }
  }

  async getNowPlayingMovies(page: number = 1) {
    const cacheKey = `now_playing:${page}`;

    try {
      const cachedResults = await this.cacheService.get(cacheKey);
      if (cachedResults) {
        return cachedResults;
      }

      const response = await this.axiosInstance.get('/movie/now_playing', {
        params: { page },
      });

      await this.cacheService.set(cacheKey, response.data, 10800);

      return response.data;
    } catch (error) {
      this.handleError('fetch now playing movies', error);
    }
  }

  async getGenres() {
    const cacheKey = 'genres';

    try {
      const cachedGenres = await this.cacheService.get(cacheKey);
      if (cachedGenres) {
        this.logger.debug(`Cache hit for genres`);
        return cachedGenres;
      }

      this.logger.log('Fetching genres from TMDB');

      const response = await this.axiosInstance.get('/genre/movie/list');

      this.logger.log(`Successfully fetched genres`);

      await this.cacheService.set(cacheKey, response.data.genres, 604800);

      return response.data.genres;
    } catch (error) {
      this.logger.error('Genres error:', {
        code: error.code,
        message: error.message,
      });
      this.handleError('fetch genres', error);
    }
  }

  async discoverMovies(filters: {
    genre?: number;
    year?: number;
    sortBy?: string;
    page?: number;
    voteAverage?: number;
    language?: string;
  }) {
    const cacheKey = `discover:${JSON.stringify(filters)}`;

    try {
      const cachedResults = await this.cacheService.get(cacheKey);
      if (cachedResults) {
        return cachedResults;
      }

      const response = await this.axiosInstance.get('/discover/movie', {
        params: {
          with_genres: filters.genre,
          year: filters.year,
          sort_by: filters.sortBy || 'popularity.desc',
          page: filters.page || 1,
          'vote_average.gte': filters.voteAverage,
          with_original_language: filters.language,
          include_adult: false,
        },
      });

      await this.cacheService.set(cacheKey, response.data, 7200);

      return response.data;
    } catch (error) {
      this.handleError('discover movies', error);
    }
  }

  async getMovieRecommendations(movieId: number, page: number = 1) {
    const cacheKey = `recommendations:${movieId}:${page}`;

    try {
      const cachedResults = await this.cacheService.get(cacheKey);
      if (cachedResults) {
        return cachedResults;
      }

      const response = await this.axiosInstance.get(
        `/movie/${movieId}/recommendations`,
        {
          params: { page },
        }
      );

      await this.cacheService.set(cacheKey, response.data, 86400);

      return response.data;
    } catch (error) {
      this.handleError('fetch movie recommendations', error);
    }
  }

  async getSimilarMovies(movieId: number, page: number = 1) {
    const cacheKey = `similar:${movieId}:${page}`;

    try {
      const cachedResults = await this.cacheService.get(cacheKey);
      if (cachedResults) {
        return cachedResults;
      }

      const response = await this.axiosInstance.get(
        `/movie/${movieId}/similar`,
        {
          params: { page },
        }
      );

      await this.cacheService.set(cacheKey, response.data, 86400);

      return response.data;
    } catch (error) {
      this.handleError('fetch similar movies', error);
    }
  }

  async getMovieCredits(movieId: number) {
    const cacheKey = `credits:${movieId}`;

    try {
      const cachedCredits = await this.cacheService.get(cacheKey);
      if (cachedCredits) {
        return cachedCredits;
      }

      const response = await this.axiosInstance.get(`/movie/${movieId}/credits`);

      await this.cacheService.set(cacheKey, response.data, 86400);

      return response.data;
    } catch (error) {
      this.handleError('fetch movie credits', error);
    }
  }

  async getMovieVideos(movieId: number) {
    const cacheKey = `videos:${movieId}`;

    try {
      const cachedVideos = await this.cacheService.get(cacheKey);
      if (cachedVideos) {
        return cachedVideos;
      }

      const response = await this.axiosInstance.get(`/movie/${movieId}/videos`);

      await this.cacheService.set(cacheKey, response.data, 86400);

      return response.data;
    } catch (error) {
      this.handleError('fetch movie videos', error);
    }
  }

  async getPersonDetails(personId: number) {
    const cacheKey = `person:${personId}`;

    try {
      const cachedPerson = await this.cacheService.get(cacheKey);
      if (cachedPerson) {
        return cachedPerson;
      }

      const response = await this.axiosInstance.get(`/person/${personId}`, {
        params: {
          append_to_response: 'movie_credits,images',
        },
      });

      await this.cacheService.set(cacheKey, response.data, 604800);

      return response.data;
    } catch (error) {
      this.handleError('fetch person details', error);
    }
  }

  async searchMulti(query: string, page: number = 1) {
    const cacheKey = `multi_search:${query}:${page}`;

    try {
      const cachedResults = await this.cacheService.get(cacheKey);
      if (cachedResults) {
        return cachedResults;
      }

      const response = await this.axiosInstance.get('/search/multi', {
        params: { 
          query, 
          page,
          include_adult: false,
        },
      });

      await this.cacheService.set(cacheKey, response.data, 3600);

      return response.data;
    } catch (error) {
      this.handleError('search', error);
    }
  }
}