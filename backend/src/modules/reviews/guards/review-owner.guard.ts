// src/modules/reviews/guards/review-owner.guard.ts
import { 
    Injectable, 
    CanActivate, 
    ExecutionContext, 
    ForbiddenException,
    NotFoundException 
  } from '@nestjs/common';
  import { ReviewsService } from '../reviews.service';
  
  @Injectable()
  export class ReviewOwnerGuard implements CanActivate {
    constructor(private reviewsService: ReviewsService) {}
  
    async canActivate(context: ExecutionContext): Promise<boolean> {
      const request = context.switchToHttp().getRequest();
      const user = request.user;
      const reviewId = request.params.id;
  
      if (!user || !reviewId) {
        throw new ForbiddenException('Authentication required');
      }
  
      try {
        const review = await this.reviewsService.findOne(reviewId);
  
        if (review.userId !== user.sub) {
          throw new ForbiddenException('You can only modify your own reviews');
        }
  
        // Attach review to request (optional optimization)
        request.review = review;
  
        return true;
      } catch (error) {
        if (error instanceof NotFoundException || error instanceof ForbiddenException) {
          throw error;
        }
        throw new ForbiddenException('Unable to verify review ownership');
      }
    }
  }