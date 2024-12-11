export class CreateBoardDto {
    number: number;
    numbers: (number | null)[][];
    userId: string;
    gameId: string;
    numsSelected: number[];
}
