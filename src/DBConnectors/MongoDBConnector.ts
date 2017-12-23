import * as mongoose from "mongoose";
import { IUserModel, mongoUser } from "../models/User";

export class MongoDBConnector {

    private static dbConnection: mongoose.Connection;

    public static setup() {
        mongoose.connect(process.env.MONGO_DB, {useMongoClient: true});
        this.dbConnection = mongoose.connection;

        this.dbConnection
            .once('open', () => {
                console.log('Connected to MongoDB');
            })
            .on('error', (error) => {
                console.log('MongoDB', error);
            });
    }


    public static getUserByExternalId(Id: number, callback: (user: IUserModel, error?: any) => void) {
        mongoUser.findOne({'Id': Id}, (error, user) => {
            if (error || user == null) {
                callback(null, error);
            } else {
                callback(user);
            }
        })
    }


    /*
        // Open the MongoDB connection.
        public openDbConnection(): any {
            const deferred = Q.defer();

            if (this.dbConnection == null) {
                mongo.connect(MongoDBConnector.url, (error: mongo.MongoError, db: mongo.Db) => {
                    if (error) {
                        return deferred.reject();
                    } else {
                        this.dbConnection = db;
                        return deferred.resolve(true);
                    }
                });
            }

            return deferred.promise;
        }*/
    /*
        // Close the existing connection.
        public closeDbConnection() {
            if (this.dbConnection) {
                this.dbConnection.close();
                this.dbConnection = null;
            }
        }

        //region one result
        public getCourseById(Id: string): any {
            return this.genericMongoDbGetter('Kurs', {'_id': Id});
        }

        public getThemeById(Id: string): any {
            return this.genericMongoDbGetter('Thema', {'_id': Id});
        }

        public getFileMetadataById(Id: string): any {
            return this.genericMongoDbGetter('Datei', {'_id': Id});
        }

        public getFileItself(Id: ObjectID): any {
            const deferred = Q.defer();
            const bucket = new mongo.GridFSBucket(this.dbConnection);
            let file;

            bucket
                .openDownloadStream(Id)
                .pipe(file)
                .on('error', (error) => {
                    return deferred.reject();
                })
                .on('finish', () => {
                    console.log('done!');
                    return deferred.resolve(file);
                });

            return deferred.promise;
        }

        public getTestbyId(Id: string): any {
            return this.genericMongoDbGetter('Test', {'_id': Id});
        }

        public getQuestionById(Id: string): any {
            return this.genericMongoDbGetter('Frage', {'_id': Id});
        }

        public getTestresultById(Id: string): any {
            return this.genericMongoDbGetter('Testergebnis', {'_id': Id});
        }

        public getUserByExternalId(Id: number): any {
            return this.genericMongoDbGetter('User', {'Id': Id});
        }

        //endregion

        //region multiple results
        public getTopicsByIds(Ids: string[]): any {
            return this.genericMongoDbGetter('Thema', {'_id': {$in: Ids}}, true);
        }

        public getFilesMetadataByIds(Ids: string[]): any {
            return this.genericMongoDbGetter('Datei', {'_id': {$in: Ids}}, true);
        }

        public getTestsByIds(Ids: string[]): any {
            return this.genericMongoDbGetter('Test', {'_id': {$in: Ids}}, true);
        }

        //endregion

        private genericMongoDbGetter(collectionName: string, query: any, allValues = false) {
            const deferred = Q.defer();

            this.dbConnection
                .collection(collectionName)
                .find(query)
                .toArray((error: mongo.MongoError, documents: any[]) => {
                    // this.dbConnection.close();
                    if (error)
                        return deferred.reject();
                    else
                        return allValues ? deferred.resolve(documents) : deferred.resolve(documents[0]);

                });

            return deferred.promise;

        }*/
}
