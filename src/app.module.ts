import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { MongooseModule } from '@nestjs/mongoose';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { GameModule } from './game/game.module';
import { BoardsModule } from './boards/boards.module';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => {
        const dbHost = configService.get<string>('DATABASE_HOST');
        const dbPort = configService.get<string>('DATABASE_PORT');
        return {
          uri: `mongodb://${dbHost}:${dbPort}/bingo`,
        };
      },
    }),
    UsersModule, AuthModule, GameModule, BoardsModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
