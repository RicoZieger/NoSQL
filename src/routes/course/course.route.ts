import { Route } from "../../interfaces/Route";
import { Express, Request, Response } from "express";
import { CourseResult, Message, Status, Topic, File } from "../../interfaces/Results";
import { MongoDBConnector } from "../../DBConnectors/MongoDBConnector";

export class CourseRoute implements Route {
    private app: Express;

    constructor(expressApp: Express) {
        this.app = expressApp;
    }

    getRoutes(): void {
        this.app.get('/user/:userId/course/:courseId', (request: Request, response: Response) => {
            response.setHeader('Content-Type', 'application/json');
            console.log("sfga");
            var mongoDbConnection = new MongoDBConnector();
            const userId = 1;//request.params.userId;
            const courseId = "KURS_NOSQL";//request.params.courseId;
            var courseResult: CourseResult;
            var courseTopics: Topic[];
            var courseTests: Quiz[];

            //TODO: console log durch error response ersetzen und nicht immer eine success response schicken
            mongoDbConnection.openDbConnection().then(function(value){
                mongoDbConnection.getUserByInternalId(userId).then(function(user){
                    var userCourse: string = user.Kurse[0];
                    mongoDbConnection.getCourse(userCourse).then(function(course){
                        courseResult = new CourseResult(userCourse, course.Titel);
                        var topics: string[] = course.Themen;
                        var tests: string[] = course.Tests;
                        courseTopics = new Topic[topics.length];
                        courseTests = new Quiz[tests.length];

                        for(var i = 0; i < topics.length; i++){
                            mongoDbConnection.getTheme(topics[i]).then(function(topic){
                                var files: string[] = topic.Dateien;
                                var currentTopic: Topic = new Topic(topic._id, topic.Titel, topic.Text);
                                var topicFiles: File[] = new File[files.length];

                                for(var f = 0; f < files.length; f++){
                                    mongoDbConnection.getFileMetadata(files[f]).then(function(file){
                                        topicFiles[f] = new File(file._id, file.Titel, "FileLinkNotExistingYet");
                                    }, function(err){
                                        console.log("Datei mit der _id "+files[f]+" existiert nicht in der MongoDB");
                                    });
                                }
                                currentTopic.files = topicFiles;
                                courseTopics[i] = currentTopic;
                            }, function(err){
                                console.log("Thema mit der _id "+topic[i]+ "existiert nicht in der MongoDB");
                            });
                        }
                        courseResult.topics = courseTopics;

                        for(var i = 0; i < tests.length; i++){
                            mongoDbConnection.getTest(tests[i]).then(function(test){
                                courseTests[i] = new Quiz(test._id, test.Titel);
                            }, function(err){
                                console.log("Test mit der _id "+tests[i]+ "existiert nicht in der MongoDB");
                            });
                        }
                        courseResult.quizs = courseTests;

                        const message: Message = {
                            status: Status.SUCCESS,
                            data: courseResult
                        };
                        response.send(JSON.stringify(message));

                    }, function(err){
                        console.log("Kurs mit der _id "+userCourse+" existiert nicht in der MongoDB");
                    });
                }, function(err){
                    console.log("User mit der _id "+userId+" existiert nicht in der MongoDB");
                });
            }, function(err){
                console.log("Verbindungsfehler zur MongoDB");
            });
        });
    }

}
