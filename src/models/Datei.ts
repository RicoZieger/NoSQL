import * as mongoose from "mongoose";
import { Document, Model } from "mongoose";

export interface IDateiModel extends Document {
    _id: string;
    Titel: string;
    Anfangsdatum: Date;
    Ablaufdatum: Date;
    gridfsLink: string;
}

let dateiSchema = new mongoose.Schema({
    _id: {type: String},
    Titel: {type: String},
    Anfangsdatum: {type: Date},
    Ablaufdatum: {type: Date},
    gridfsLink: {type: String}
});

export const MongoDatei: Model<IDateiModel> = mongoose.model<IDateiModel>('Datei', dateiSchema, 'Datei');
