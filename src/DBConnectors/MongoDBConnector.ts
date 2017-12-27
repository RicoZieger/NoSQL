import * as mongoose from "mongoose";
import fs = require('fs');
import Grid = require('gridfs-stream');
import { IUserModel, mongoUser } from "../models/User";
import { IThemaModel, mongoThema } from "../models/Thema";
import { IDateiModel, mongoDatei } from "../models/Datei";
import { IKursModel, mongoKurs } from "../models/Kurs";
import { ITestModel, mongoTest } from "../models/Test";
import { IFrageModel, mongoFrage} from "../models/Frage";

export class MongoDBConnector {

    private static dbConnection: mongoose.Connection;
    private static gfs;

    public static setup() {
        mongoose.connect(process.env.MONGO_DB, {useMongoClient: true});
        mongoose.Promise = require('q').Promise;
        this.dbConnection = mongoose.connection;

        this.dbConnection
            .once('open', () => {  
                MongoDBConnector.gfs = Grid(mongoose.connection.db, mongoose.mongo);
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

    public static getFileMetadataById(Id: string): Promise<IDateiModel[]>{
        const query = mongoDatei.find({'_id': Id});
        const promise = query.exec();
        return promise;
    }

    public static getFileById(Id: string): any {
        return MongoDBConnector.gfs.createReadStream({_id : Id});
    }

    public static saveFile(filename: string, filepath: string): any{
        let writestream = MongoDBConnector.gfs.createWriteStream({filename: filename});
        fs.createReadStream(filepath).pipe(writestream);
        return writestream;
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
