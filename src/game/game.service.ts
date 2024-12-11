import { Injectable } from '@nestjs/common';
import { CreateGameDto } from './dto/create-game.dto';
import { UpdateGameDto } from './dto/update-game.dto';
import { Game } from './entities/game.entity';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreateBoardDto } from 'src/boards/dto/create-board.dto';
import { BoardsService } from 'src/boards/boards.service';

@Injectable()
export class GameService {

  private game: Game | null;

  constructor(
    @InjectModel(Game.name) private gameModel: Model<Game>,
    private readonly boardService: BoardsService
  ) { }

  async create(createGameDto: CreateGameDto): Promise<Game> {
    createGameDto.players = []
    createGameDto.drawNumbers = []
    createGameDto.state = 'Waiting'
    const createdGame = new this.gameModel(createGameDto)
    this.game = await createdGame.save()
    await this.makeBoards(2)
    return this.game
  }

  findAll() {
    return `This action returns all game`;
  }

  findOne(id: number) {
    return `This action returns a #${id} game`;
  }

  async update(id: string, updateGameDto: UpdateGameDto) {
    return await this.gameModel.findByIdAndUpdate(id, updateGameDto);
  }

  remove(id: number) {
    return `This action removes a #${id} game`;
  }

  async makeBoards(cantidad: number) {
    for (let i = 0; i < cantidad; i++) {
      await this.makeBoard(i)
    }
  }

  async makeBoard(number: number) {
    let boardDto = new CreateBoardDto
    boardDto.gameId = (this.game as any)._id
    boardDto.number = (number + 1)
    boardDto.numbers = this.boardNumbers()
    boardDto.numsSelected = []
    await this.boardService.create(boardDto)
  }

  boardNumbers() {
    let numbers = Array(5).fill(null).map(() => Array(5).fill(null));
    let usedNumbers = new Set();

    for (let row = 0; row < 5; row++) {
      for (let col = 0; col < 5; col++) {
        if (row == 2 && col == 2) {
          continue;
        }

        let ramdonNum: number;

        do {
          ramdonNum = (Math.floor(Math.random() * 15) + 1) + (15 * col);
        } while (usedNumbers.has(ramdonNum));

        usedNumbers.add(ramdonNum)
        numbers[row][col] = ramdonNum
      }
    }

    return numbers
  }
}
