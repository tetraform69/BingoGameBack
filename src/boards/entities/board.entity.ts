import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type BoardDocument = HydratedDocument<Board>;

@Schema({
  timestamps: true,
})
export class Board {
  @Prop()
  number: number;

  @Prop({
    type: [[{ type: Number, required: false, default: null }]],
  })
  numbers: (number | null)[][];

  @Prop()
  userId: string;

  @Prop()
  gameId: string;

  @Prop()
  numsSelected: number[];
}

export const BoardSchema = SchemaFactory.createForClass(Board);
