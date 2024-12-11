import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type UserDocument = HydratedDocument<User>;

@Schema({
    timestamps: true,
})
export class User {

    @Prop()
    username: string;

    @Prop()
    email: string;

    @Prop()
    password: string;

    @Prop()
    lobbyId: number;

    @Prop()
    bingoCard: number;

}

export const UserSchema = SchemaFactory.createForClass(User);
