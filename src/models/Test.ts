import * as mongoose from "mongoose";
import { Document, Model } from "mongoose";

export interface ITestModel extends Document {
    _id: string;
    Titel: string;
    Anfangsdatum: Date;
    Ablaufdatum: Date;
    AbgeschlossenVon: string[];
    Fragen: string[];
}

let testSchema = new mongoose.Schema({
    _id: {type: String},
    Titel: {type: String},
    Anfangsdatum: [{type: String}],
    Ablaufdatum: [{type: Number}],
    AbgeschlossenVon: [{type: String}],
    Fragen: [{type: String}]
});

export const MongoTest: Model<ITestModel> = mongoose.model<ITestModel>('Test', testSchema, 'Test');
