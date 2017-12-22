import { Route } from "../../interfaces/Route";
import { Express, Request, Response } from "express";
import { CourseResult, Message, Status, Topic, File, Quiz } from "../../interfaces/Results";
import { MongoDBConnector } from "../../DBConnectors/MongoDBConnector";

var Q = require('q');

export class CourseRoute implements Route {
    private app: Express;

    constructor(expressApp: Express) {
        this.app = expressApp;
    }

    getRoutes(): void {
        this.app.get('/user/:userId/course/:courseId', (request: Request, response: Response) => {
            response.setHeader('Content-Type', 'application/json');

            var mongoDbConnection = new MongoDBConnector();
            const userId: int = 1;//request.params.userId;
            const courseId: string = "KURS_NOSQL";//request.params.courseId;

            //TODO: console log durch error response ersetzen und nicht immer eine success response schicken
            mongoDbConnection.openDbConnection().then(function(value){
                mongoDbConnection.getUserByExternalId(userId).then(function(user){
                    var userCourse: string = user.Kurse[0];
                    mongoDbConnection.getCourse(userCourse).then(function(course){
                        mongoDbConnection.getTopics(course.Themen).then(function(topicsJSON){
                            var allFiles: string[] = [];
                            var allFilesCounter = 0;
                            for(var i = 0; i < topicsJSON.length; i++){
                              var thisTopicsFiles = topicsJSON[i].Dateien;
                              for(var thisTopicsFilesCounter = 0; thisTopicsFilesCounter < thisTopicsFiles.length; thisTopicsFilesCounter ++){
                                allFiles.push(thisTopicsFiles[thisTopicsFilesCounter]);
                              }
                            }

                            mongoDbConnection.getFilesMetadata(allFiles).then(function(filesJSON){
                                mongoDbConnection.getTests(course.Tests).then(function(testsJSON){
                                    var courseResult: CourseResult = new CourseResult(userCourse, course.Titel);
                                    var courseTopics: Topic[] = new Array(topicsJSON.length);
                                    var courseFiles: File[] = new Array(filesJSON.length);
                                    var courseTests: Quiz[] = new Array(testsJSON.length);

                                    for(var quizCounter = 0; quizCounter < courseTests.length; quizCounter++){
                                      courseTests[quizCounter] = new Quiz(testsJSON[quizCounter]._id, testsJSON[quizCounter].Titel);
                                    }

                                    for(var fileCounter = 0; fileCounter < courseFiles.length; fileCounter++){
                                      courseFiles[fileCounter] = new File(filesJSON[fileCounter]._id, filesJSON[fileCounter].Titel, "FileLinkNotExistingYet");
                                    }

                                    for(var topicCounter = 0; topicCounter < courseTopics.length; topicCounter++){
                                      var tmpTopic = new Topic(topicsJSON[topicCounter]._id, topicsJSON[topicCounter].Titel, topicsJSON[topicCounter].Text);
                                      var topicFiles: File[] = [];
                                      var thisTopicFileIds: string[] = topicsJSON[topicCounter].Dateien;

                                      for(var fileCounter = 0; fileCounter < courseFiles.length; fileCounter++){
                                        for(var fileIdsCounter = 0; fileIdsCounter < thisTopicFileIds.length; fileIdsCounter++){
                                          if(thisTopicFileIds[fileIdsCounter] === courseFiles[fileCounter].id){
                                            topicFiles.push(courseFiles[fileCounter]);
                                            break;
                                          }
                                        }
                                      }

                                      tmpTopic.files = topicFiles;
                                      courseTopics[topicCounter] = tmpTopic;
                                    }

                                    courseResult.topics = courseTopics;
                                    courseResult.quizs = courseTests;

                                    const message: Message = {
                                        status: Status.SUCCESS,
                                        data: courseResult
                                    };
                                    response.send(JSON.stringify(message));
                                }, function(err){
                                    console.log("Testliste konnte nicht geladen werden: "+JSON.stringify(course.Tests));
                                });
                            }, function(err){
                                console.log("Dateiliste konnte nicht geladen werden: "+JSON.stringify(allFiles))
                            });
                        }, function(err){
                            console.log("Themenlist konnte nicht geladen werden: "+JSON.stringify(topics));
                        });
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
