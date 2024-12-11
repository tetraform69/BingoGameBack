import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { PlayerDto } from "../dto/player.dto";

export type GameDocument = HydratedDocument<Game>;

@Schema({
    timestamps: true,
})
export class Game {

    @Prop()
    state: string;
    
    @Prop()
    players: PlayerDto[];
    
    @Prop()
    drawNumbers: number[];

    @Prop()
    winner: PlayerDto;
}

export const GameSchema = SchemaFactory.createForClass(Game);
