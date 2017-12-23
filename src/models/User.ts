import * as mongoose from "mongoose";
import { Document, Model } from "mongoose";
import { UserLevel } from "../interfaces/Results";

export interface IUserModel extends Document {
    _id: string;
    Id: number;
    UserTyp: UserLevel;
    Kurse: string[];
    Testergebnisse: string[]
}

let userSchema = new mongoose.Schema({
    _id: {type: String},
    Id: {type: Number},
    UserTyp: {type: String},
    Kurse: [{type: String}],
    Testergebnisse: [{type: String}]
});

export const mongoUser: Model<IUserModel> = mongoose.model<IUserModel>('User', userSchema, 'User');