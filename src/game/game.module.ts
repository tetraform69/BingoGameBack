import { Module } from '@nestjs/common';
import { GameService } from './game.service';
import { GameGateway } from './game.gateway';
import { UsersModule } from 'src/users/users.module';
import { BoardsModule } from 'src/boards/boards.module';
import { MongooseModule } from '@nestjs/mongoose';
import { Game, GameSchema } from './entities/game.entity';

@Module({
  imports: [ UsersModule, BoardsModule, MongooseModule.forFeature([{ name: Game.name, schema: GameSchema }])],
  providers: [GameGateway, GameService],
})
export class GameModule { }
