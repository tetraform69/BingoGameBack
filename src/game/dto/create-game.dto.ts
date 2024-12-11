import { PlayerDto } from "./player.dto";

export class CreateGameDto {
    state: string;
    players: PlayerDto[];
    drawNumbers: number[];
    winner: PlayerDto;
}
