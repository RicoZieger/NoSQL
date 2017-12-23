import { Route } from "../../interfaces/Route";
import { Request, Response } from "express";
import { CourseResult, File, Message, Quiz, Status, Topic } from "../../interfaces/Results";
import { MongoDBConnector } from "../../DBConnectors/MongoDBConnector";


export class CourseRoute extends Route {

    getRoutes(): void {
        this.app.get('/user/:userId/course/:courseId', (request: Request, response: Response) => {
            response.setHeader('Content-Type', 'application/json');

            var mongoDbConnection = new MongoDBConnector();
            const userId = 1;//request.params.userId;
            const courseId: string = "KURS_NOSQL";//request.params.courseId;

            //TODO: console log durch error response ersetzen und nicht immer eine success response schicken
            mongoDbConnection.openDbConnection()
                .then((value) => {
                    mongoDbConnection.getUserByExternalId(userId)
                        .then((user) => {
                            const userCourse: string = user.Kurse[0];
                            mongoDbConnection.getCourseById(userCourse)
                                .then((course) => {
                                    mongoDbConnection.getTopicsByIds(course.Themen)
                                        .then((topicsJSON) => {
                                            const allFiles: string[] = [];
                                            const allFilesCounter = 0;
                                            for (let i = 0; i < topicsJSON.length; i++) {
                                                const thisTopicsFiles = topicsJSON[i].Dateien;
                                                for (let thisTopicsFilesCounter = 0; thisTopicsFilesCounter < thisTopicsFiles.length; thisTopicsFilesCounter++) {
                                                    allFiles.push(thisTopicsFiles[thisTopicsFilesCounter]);
                                                }
                                            }

                                            mongoDbConnection.getFilesMetadataByIds(allFiles)
                                                .then((filesJSON) => {
                                                    mongoDbConnection.getTestsByIds(course.Tests)
                                                        .then((testsJSON) => {
                                                            const courseResult: CourseResult = new CourseResult(userCourse, course.Titel);
                                                            const courseTopics: Topic[] = new Array(topicsJSON.length);
                                                            const courseFiles: File[] = new Array(filesJSON.length);
                                                            const courseTests: Quiz[] = new Array(testsJSON.length);

                                                            for (let quizCounter = 0; quizCounter < courseTests.length; quizCounter++) {
                                                                courseTests[quizCounter] = new Quiz(testsJSON[quizCounter]._id, testsJSON[quizCounter].Titel);
                                                            }

                                                            for (let fileCounter = 0; fileCounter < courseFiles.length; fileCounter++) {
                                                                courseFiles[fileCounter] = new File(filesJSON[fileCounter]._id, filesJSON[fileCounter].Titel, "FileLinkNotExistingYet");
                                                            }

                                                            for (let topicCounter = 0; topicCounter < courseTopics.length; topicCounter++) {
                                                                const tmpTopic = new Topic(topicsJSON[topicCounter]._id, topicsJSON[topicCounter].Titel, topicsJSON[topicCounter].Text);
                                                                const topicFiles: File[] = [];
                                                                const thisTopicFileIds: string[] = topicsJSON[topicCounter].Dateien;

                                                                for (let fileCounter = 0; fileCounter < courseFiles.length; fileCounter++) {
                                                                    for (let fileIdsCounter = 0; fileIdsCounter < thisTopicFileIds.length; fileIdsCounter++) {
                                                                        if (Number(thisTopicFileIds[fileIdsCounter]) === courseFiles[fileCounter].id) {
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
                                                        }, (err) => {
                                                            console.log("Testliste konnte nicht geladen werden: " + JSON.stringify(course.Tests));
                                                        });
                                                }, (err) => {
                                                    console.log("Dateiliste konnte nicht geladen werden: " + JSON.stringify(allFiles))
                                                });
                                        }, (err) => {
                                            console.log("Themenlist konnte nicht geladen werden: " /* + JSON.stringify(topics) */);
                                        });
                                }, (err) => {
                                    console.log("Kurs mit der _id " + userCourse + " existiert nicht in der MongoDB");
                                });
                        }, (err) => {
                            console.log("User mit der _id " + userId + " existiert nicht in der MongoDB");
                        });
                }, (err) => {
                    console.log(err);
                    console.log("Verbindungsfehler zur MongoDB");
                });
        });
    }

}
