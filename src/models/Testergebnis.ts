import * as mongoose from "mongoose";
import { Document, Model } from "mongoose";

export interface ITestergebnisModel extends Document {
    _id: string;
    ErreichtePunkte: number;
    ZugehörigerTest: string;
    ZugehörigerUser: string;
}

let testergebnisSchema = new mongoose.Schema({
    _id: {type: String},
    ErreichtePunkte: {type: Number},
    ZugehörigerTest: {type: String},
    ZugehörigerUser: {type: String}
});

export const MongoTestergebnis: Model<ITestergebnisModel> = mongoose.model<ITestergebnisModel>('Testergebnis', testergebnisSchema, 'Testergebnis');
