import { WebSocketGateway, SubscribeMessage, MessageBody, OnGatewayConnection, OnGatewayDisconnect, WebSocketServer, ConnectedSocket, WsException } from '@nestjs/websockets';
import { CreateGameDto } from './dto/create-game.dto';
import { UpdateGameDto } from './dto/update-game.dto';
import { Game, GameDocument } from './entities/game.entity';
import { GameService } from './game.service';
import { UsersService } from 'src/users/users.service';
import { BoardsService } from 'src/boards/boards.service';
import { Server, Socket } from 'socket.io';
import { Board, BoardDocument } from 'src/boards/entities/board.entity';
import { User, UserDocument } from 'src/users/entities/user.entity';
import { UpdateBoardDto } from 'src/boards/dto/update-board.dto';
import { PlayerDto } from './dto/player.dto';

@WebSocketGateway({
  namespace: '/game',
})
export class GameGateway implements OnGatewayConnection, OnGatewayDisconnect {
  constructor(
    private readonly gameService: GameService,
    private readonly usersService: UsersService,
    private readonly boardsService: BoardsService,
  ) { }

  @WebSocketServer()
  server: Server;
  private timeWaiting: number = 60;
  private drawTime: number = 5;
  private waitingInterval: any;
  private drawInterval: any;
  private gameDto: CreateGameDto = new CreateGameDto;
  private game: Game | null = null;
  private usedNumbers: any = new Set([null]);

  handleConnection(client: Socket) {
    console.log(client.id)
    client.emit('gameState', this.gameState());
  }

  handleDisconnect(client: any) {
    console.log(`disconected user ${client.id}`);
  }

  @SubscribeMessage('getGameState')
  handleGetGameState(@ConnectedSocket() client: Socket) {
    client.emit('gameState', this.gameState());
  }

  @SubscribeMessage('getPlayers')
  handleGetPlayers(@ConnectedSocket() client: Socket) {
    client.emit('players', this.players());
  }

  @SubscribeMessage('getTime')
  handleGetTime(@ConnectedSocket() client: Socket) {
    client.emit('timeRemaining', this.timeWaiting);
  }

  @SubscribeMessage('joinGame')
  async joinGame(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: any
  ): Promise<any> {
    try {
      const user = await this.usersService.findOne({ "username": data.username });

      if (!user) {
        throw new WsException('User Not Found')
      }

      if (this.game == null) {
        this.game = await this.gameService.create(this.gameDto);
      }

      if (this.gameState() === 'Running') { throw new WsException('Game has started') }

      let gameId = (this.game as GameDocument).id

      const board = await this.boardsService.findOne({
        gameId: gameId,
        userId: { "$exists": false }
      })

      if (board === null) { throw new WsException('Boards not available') }

      this.game.players.push(user);
      this.server.emit('players', this.players());

      let boardDto = new UpdateBoardDto()
      boardDto.userId = (user as UserDocument).id
      await this.boardsService.update((board as BoardDocument).id, boardDto)

      if (this.waitingInterval == null) {
        this.startWaiting()
      }

      return { ok: true, data: board };

    } catch (err) {
      return { ok: false, message: err.message };
    }
  }

  @SubscribeMessage('checkWinner')
  async handleCheckWinner(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: any
  ): Promise<any> {
    try {
      const board = await this.boardsService.findOne(data.boardId)
      const user = await this.usersService.findOne(board.userId)

      board.numsSelected = data.numsSelected

      const isWinner = this.winningCorners(board)
        || this.winningRow(board)
        || this.winningCol(board)
        || this.winningDiagonal(board)

      if (isWinner) {
        this.server.emit('winner', {
          user: user.username,
          board: {
            number: board.number,
            numbers: board.numbers,
            numSelect: board.numsSelected,
          }
        })
        this.gameClosed(board, user)
      } else {
        this.removePlayer(user.username)
        client.emit('disqualified', 'The player has been disqualified');
        client.disconnect();
      }
    } catch (err) {
      return { ok: false, message: err.message }
    }
  }

  gameState() {
    return this.game?.state ?? 'Not Started'
  }

  players() {
    return this.game?.players.map(user => user.username) ?? []
  }

  drawNumbers() {
    return this.game?.drawNumbers || []
  }

  startWaiting() {
    this.waitingInterval = setInterval(() => {
      this.timeWaiting -= 1
      this.server.emit('timeRemaining', this.timeWaiting)
      if (this.timeWaiting == 0) {
        clearInterval(this.waitingInterval)
        this.waitingInterval = null
        this.startGame()
      }
    }, 1000) //ms
  }

  async startGame() {
    this.game.state = 'Running'
    this.server.emit('gameState', this.gameState());

    let updateGameDto = new UpdateGameDto();
    updateGameDto.state = this.game.state;
    updateGameDto.players = this.game.players;
    await this.gameService.update((this.game as GameDocument).id, updateGameDto)

    let ramdonNum = (Math.floor(Math.random() * 75) + 1);
    this.usedNumbers.add(ramdonNum)
    this.game.drawNumbers.push(ramdonNum)
    this.server.emit('newNumber', ramdonNum)
    this.server.emit('drawNumbers', this.drawNumbers())

    this.startDrawNumbers()
  }

  startDrawNumbers() {
    this.drawInterval = setInterval(() => {

      if (this.usedNumbers.size >= 75) {
        clearInterval(this.drawInterval)
        this.drawInterval = null
      }

      let ramdonNum: number;

      do {
        ramdonNum = (Math.floor(Math.random() * 75) + 1);
      } while (this.usedNumbers.has(ramdonNum) && this.usedNumbers.size < 75);

      this.usedNumbers.add(ramdonNum)
      this.game.drawNumbers.push(ramdonNum)
      this.server.emit('newNumber', ramdonNum)
      this.server.emit('drawNumbers', this.drawNumbers())
    }, this.drawTime * 1000) //ms
  }

  winningCorners(board: Board): boolean {

    const numberslength = board.numbers.length - 1
    const corners = [
      board.numbers[0][0],
      board.numbers[0][numberslength],
      board.numbers[numberslength][0],
      board.numbers[numberslength][numberslength],
    ]

    const numsSelected = new Set(board.numsSelected)

    return corners.every(
      corner => this.usedNumbers.has(corner) && numsSelected.has(corner)
    )
  }

  winningRow(board: Board): boolean {
    const numsSelected = new Set(board.numsSelected)

    return board.numbers.some((row) =>
      row.every((number) => this.usedNumbers.has(number) && numsSelected.has(number))
    )
  }

  winningCol(board: Board): boolean {
    const numsSelected = new Set(board.numsSelected)

    return board.numbers[0].some((_, colIndex) =>
      board.numbers.every((row) => this.usedNumbers.has(row[colIndex]) && numsSelected.has(row[colIndex]))
    )
  }

  winningDiagonal(board: Board): boolean {
    const numsSelected = new Set(board.numsSelected)

    let primaryDiagonal: boolean

    // diagonal principal
    primaryDiagonal = board.numbers.every((row, colIndex) =>
      this.usedNumbers.has(row[colIndex]) && numsSelected.has(row[colIndex])
    )

    let secundaryDiagonal: boolean

    // diagonal secundaria
    secundaryDiagonal = board.numbers.every((row, colIndex) => {
      let index = row.length - colIndex - 1
      return this.usedNumbers.has(row[index]) && numsSelected.has(row[index])
    })

    return primaryDiagonal || secundaryDiagonal
  }

  gameClosed(board: Board | null = null, user: User | null = null) {
    let boardDto = new UpdateBoardDto()
    let gameDto = new UpdateGameDto()

    if (board && user) {
      // Guardar datos del tablero y del ganador
      boardDto.numsSelected = board.numsSelected
      this.boardsService.update((board as BoardDocument).id, boardDto)

      gameDto.winner = new PlayerDto(user.username)
    }

    gameDto.state = 'Closed'
    gameDto.drawNumbers = this.drawNumbers()
    this.gameService.update((this.game as GameDocument).id, gameDto)

    // reiniciar juego
    clearInterval(this.waitingInterval)
    clearInterval(this.drawInterval)
    this.game = null
    this.timeWaiting = 60
    this.gameDto = new CreateGameDto()
    this.waitingInterval = null
    this.drawInterval = null
    this.usedNumbers = new Set([null])
  }

  removePlayer(username: string) {
    this.game.players = this.game.players.filter((user) => user.username !== username)
    if (this.game.players.length == 0) {
      this.server.disconnectSockets
      this.gameClosed()
    }
    this.server.emit('players', this.players())
  }
}
