// src/common/pipes/sanitize-review.pipe.ts
import { PipeTransform, Injectable, ArgumentMetadata, BadRequestException } from '@nestjs/common';
import sanitizeHtml from 'sanitize-html';

@Injectable()
export class SanitizeReviewPipe implements PipeTransform {
  transform(value: any, metadata: ArgumentMetadata) {
    if (metadata.type !== 'body') {
      return value;
    }

    // Sanitize content
    if (value.content) {
      value.content = sanitizeHtml(value.content, {
        allowedTags: [], // No HTML allowed
        allowedAttributes: {},
      }).trim();
    }

    // Sanitize title
    if (value.title) {
      value.title = sanitizeHtml(value.title, {
        allowedTags: [],
        allowedAttributes: {},
      }).trim();
    }

    // Round rating to 1 decimal place
    if (value.rating !== undefined) {
      value.rating = Math.round(value.rating * 10) / 10;

      if (value.rating < 0 || value.rating > 10) {
        throw new BadRequestException('Rating must be between 0 and 10');
      }
    }

    return value;
  }
}