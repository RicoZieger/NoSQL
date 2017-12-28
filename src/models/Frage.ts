import * as mongoose from "mongoose";
import { Document, Model } from "mongoose";

export interface IFrageModel extends Document {
    _id: string;
    Fragetext: string;
    Antworten: string[];
    KorrekteAntwortenIndex: number[];
}

let frageSchema = new mongoose.Schema({
    _id: {type: String},
    Fragetext: {type: String},
    Antworten: [{type: String}],
    KorrekteAntwortenIndex: [{type: Number}]
});

export const MongoFrage: Model<IFrageModel> = mongoose.model<IFrageModel>('Frage', frageSchema, 'Frage');
