import { Injectable } from '@nestjs/common';
import { CreateBoardDto } from './dto/create-board.dto';
import { UpdateBoardDto } from './dto/update-board.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Board, BoardDocument } from './entities/board.entity';
import { Model } from 'mongoose';

@Injectable()
export class BoardsService {
  constructor(@InjectModel(Board.name) private boardModel: Model<BoardDocument>) { }

  async create(createBoardDto: CreateBoardDto) {
    const createdBoard = new this.boardModel(createBoardDto);
    return await createdBoard.save();
  }

  async findAll() {
    return await this.boardModel.find().exec();
  }

  async findOne(condicion: string | any) {
    if (typeof (condicion) === 'string')
      return await this.boardModel.findById(condicion).exec();
    else
      return await this.boardModel.findOne(condicion).exec();
  }

  async update(id: string, updateBoardDto: UpdateBoardDto) {
    return await this.boardModel.findByIdAndUpdate(id, updateBoardDto, { new: true }).exec();
  }

  async remove(id: string) {
    return await this.boardModel.findByIdAndDelete(id).exec();
  }
}
