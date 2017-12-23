import * as mongoose from "mongoose";
import { Document, Model } from "mongoose";

export interface IThemaModel extends Document {
    _id: string;
    Titel: string;
    Text: string;
    Dateien: string[];
}

let themaSchema = new mongoose.Schema({
    _id: {type: String},
    Titel: {type: String},
    Text: {type: String},
    Dateien: [{type: String}]
});

export const mongoThema: Model<IThemaModel> = mongoose.model<IThemaModel>('Thema', themaSchema, 'Thema');
