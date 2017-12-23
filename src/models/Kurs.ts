import * as mongoose from "mongoose";
import { Document, Model } from "mongoose";

export interface IKursModel extends Document {
    _id: string;
    Titel: string;
    Themen: string[];
    Tests: string[];
}

let kursSchema = new mongoose.Schema({
    _id: {type: String},
    Titel: {type: String},
    Themen: [{type: String}],
    Tests: [{type: String}]
});

export const mongoUser: Model<IKursModel> = mongoose.model<IKursModel>('Kurs', kursSchema, 'Kurs');
