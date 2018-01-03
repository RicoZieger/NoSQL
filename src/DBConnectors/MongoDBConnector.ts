import * as mongoose from "mongoose";
import { IUserModel, MongoUser } from "../models/User";
import { IThemaModel, MongoThema } from "../models/Thema";
import { IDateiModel, MongoDatei } from "../models/Datei";
import { IKursModel, MongoKurs } from "../models/Kurs";
import { ITestModel, MongoTest } from "../models/Test";
import { IFrageModel, MongoFrage } from "../models/Frage";
import { ITokenModel, MongoToken } from "../models/Token";
import { ITestergebnisModel, MongoTestergebnis } from "../models/Testergebnis";
import fs = require('fs');
import Grid = require('gridfs-stream');
import { UserLevel } from "../interfaces/Results";

export class MongoDBConnector {

    private static dbConnection: mongoose.Connection;
    private static gfs;

    public static setup() {
        mongoose.connect(process.env.MONGO_DB, {useMongoClient: true});
        mongoose.Promise = require('q').Promise; // http://mongoosejs.com/docs/promises.html
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

    public static getUserById(Id: string): Promise<IUserModel> {
        const query = MongoUser.findOne({'_id': Id});
        const promise = query.exec();
        return promise;
    }

    public static getCourseById(Id: string): Promise<IKursModel> {
        const query = MongoKurs.findOne({'_id': Id});
        const promise = query.exec();
        return promise;
    }

    public static getTestById(Id: string): Promise<ITestModel> {
        const query = MongoTest.findOne({'_id': Id});
        const promise = query.exec();
        return promise;
    }

    public static getFileMetadataById(Id: string): Promise<IDateiModel> {
        const query = MongoDatei.findOne({'_id': Id});
        const promise = query.exec();
        return promise;
    }

    public static getFileById(Id: string): any {
        return MongoDBConnector.gfs.createReadStream({_id: Id});
    }

    public static saveFile(filename: string, filepath: string): any {
        let writestream = MongoDBConnector.gfs.createWriteStream({filename: filename});
        fs.createReadStream(filepath).pipe(writestream);
        return writestream;
    }

    public static saveFileWithId(id: string, filename: string, filepath: string): any {
        let writestream = MongoDBConnector.gfs.createWriteStream({_id: id, filename: filename});
        fs.createReadStream(filepath).pipe(writestream);
        return writestream;
    }

    public static getCoursesByIds(Ids: string[]): Promise<IKursModel[]> {
        const query = MongoKurs.find({'_id': {$in: Ids}});
        const promise = query.exec();
        return promise;
    }

    public static getTopicsByIds(Ids: string[]): Promise<IThemaModel[]> {
        const query = MongoThema.find({'_id': {$in: Ids}});
        const promise = query.exec();
        return promise;
    }

    public static getFilesMetadataByIds(Ids: string[]): Promise<IDateiModel[]> {
        const query = MongoDatei.find({'_id': {$in: Ids}});
        const promise = query.exec();
        return promise;
    }

    public static getTestsByIds(Ids: string[]): Promise<ITestModel[]> {
        const query = MongoTest.find({'_id': {$in: Ids}});
        const promise = query.exec();
        return promise;
    }

    public static getQuestionsByIds(Ids: string[]): Promise<IFrageModel[]> {
        const query = MongoFrage.find({'_id': {$in: Ids}});
        const promise = query.exec();
        return promise;
    }

    public static getAllStudentsOfCourse(Id: string): Promise<IUserModel[]> {
        const query = MongoUser.find({'Kurse': Id, 'UserTyp': 'STUDENT'});
        const promise = query.exec();
        return promise;
    }

    public static getAllTestresultsOfTest(testId: string): Promise<ITestergebnisModel[]> {
        const query = MongoTestergebnis.find({'ZugehörigerTest': testId});
        const promise = query.exec();
        return promise;
    }

    public static getAllAvailableUsers(): Promise<IUserModel[]> {
        const query = MongoUser.find({$where:'this.Kurse.length<1'})
        const promise = query.exec();
        return promise;
    }

    public static getTokenForUser(Id: string): Promise<ITokenModel> {
        const query = MongoToken.findOne({_id :Id})
        const promise = query.exec();
        return promise;
    }   

}
