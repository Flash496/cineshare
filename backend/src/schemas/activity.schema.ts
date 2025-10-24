import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class Activity extends Document {
  @Prop({ required: true })
  userId: string;

  @Prop({ required: true })
  actorId: string; // User who performed the action

  @Prop({
    required: true,
    enum: ['review', 'follow', 'like', 'watchlist', 'comment'],
  })
  type: string;

  @Prop({ type: Object })
  data: {
    reviewId?: string;
    movieId?: number;
    movieTitle?: string;
    rating?: number;
    excerpt?: string;
  };

  @Prop({ default: Date.now })
  createdAt: Date;
}

export const ActivitySchema = SchemaFactory.createForClass(Activity);
