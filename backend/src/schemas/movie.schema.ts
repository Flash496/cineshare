import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class Movie extends Document {
    @Prop({ required: true, unique: true })
    tmdbId: number;
    @Prop({ required: true })
    title: string;
    @Prop()
    originalTitle: string;
    @Prop()
    overview: string;
    @Prop()
    releaseDate: Date;
    @Prop()
    posterPath: string;
    @Prop()
    backdropPath: string;
    @Prop([String])
    genres: string[];
    @Prop()
    runtime: number;
    @Prop()
    tmdbRating: number;
    @Prop()
    popularity: number;
    @Prop({ default: Date.now })
    cachedAt: Date;
}
export const MovieSchema = SchemaFactory.createForClass(Movie);
