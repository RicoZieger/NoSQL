import * as mongoose from "mongoose";
import { IUserModel, mongoUser } from "../models/User";
import { IThemaModel, mongoThema } from "../models/Thema";
import { IDateiModel, mongoDatei } from "../models/Datei";
import { IKursModel, mongoKurs } from "../models/Kurs";
import { ITestModel, mongoTest } from "../models/Test";
import { IFrageModel, mongoFrage} from "../models/Frage";

export class MongoDBConnector {

    private static dbConnection: mongoose.Connection;

    public static setup() {
        mongoose.connect(process.env.MONGO_DB, {useMongoClient: true});
        mongoose.Promise = require('q').Promise;
        this.dbConnection = mongoose.connection;

        this.dbConnection
            .once('open', () => {
                console.log('Connected to MongoDB');
            })
            .on('error', (error) => {
                console.log('MongoDB', error);
            });
    }

    public static getUserByExternalId(Id: number): Promise<IUserModel>{
        const query = mongoUser.findOne({'Id': Id});
        const promise = query.exec();
        return promise;
    }

    public static getCourseById(Id: string): Promise<IKursModel>{
        const query = mongoKurs.findOne({'_id': Id});
        const promise = query.exec();
        return promise;
    }

    public static getTestById(Id: string): Promise<ITestModel>{
        const query = mongoTest.findOne({'_id': Id});
        const promise = query.exec();
        return promise;
    }

    public static getTopicsByIds(Ids: string[]): Promise<IThemaModel[]>{
        const query = mongoThema.find({'_id': {$in : Ids}});
        const promise = query.exec();
        return promise;
    }

    public static getFilesMetadataByIds(Ids: string[]): Promise<IDateiModel[]>{
        const query = mongoDatei.find({'_id': {$in : Ids}});
        const promise = query.exec();
        return promise;
    }

    public static getTestsByIds(Ids: string[]): Promise<ITestModel[]>{
        const query = mongoTest.find({'_id': {$in : Ids}});
        const promise = query.exec();
        return promise;
    }

    public static getQuestionsByIds(Ids: string[]): Promise<IFrageModel[]>{
        const query = mongoFrage.find({'_id': {$in : Ids}});
        const promise = query.exec();
        return promise;
    }

}
