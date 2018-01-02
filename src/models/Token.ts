import * as mongoose from "mongoose";
import { Document, Model } from "mongoose";

export interface ITokenModel extends Document {
    _id: string;
    secret: string;
}

let tokenSchema = new mongoose.Schema({
    _id: {type: String},
    secret: {type: String}
});

export const MongoToken: Model<ITokenModel> = mongoose.model<ITokenModel>('Token', tokenSchema, 'Token');
