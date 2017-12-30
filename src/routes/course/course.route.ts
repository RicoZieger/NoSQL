import { Route } from "../../interfaces/Route";
import { Request, Response } from "express";
import { IThemaModel, MongoThema } from "../../models/Thema";
import { IDateiModel, MongoDatei } from "../../models/Datei";
import { IKursModel, MongoKurs } from "../../models/Kurs";
import { ITestModel, MongoTest } from "../../models/Test";
import { IFrageModel, MongoFrage } from "../../models/Frage";
import { IUserModel, MongoUser } from "../../models/User";
import { CourseResult, FileMetadata, QuizMetadata, Topic, UserLevel } from "../../interfaces/Results";
import { MongoDBConnector } from "../../DBConnectors/MongoDBConnector";
import filesystem = require('fs');

export class CourseRoute extends Route {

    private static course: IKursModel;
    private static topics: IThemaModel[];
    private static tests: ITestModel[];
    private static files: IDateiModel[];

    getRoutes(): void {
        //TODO mit der route /courses/user/:userId kann diese Route im Grunde komplett entfallen
        this.app.get('/user/:userId/course/:courseId', (request: Request, response: Response) => {
            response.setHeader('Content-Type', 'application/json');

            //TODO: Kurse sind nicht vom Benutzer abhängig, die user id hat hier keinen Einfluss und kann entfallen.
            //(Wird aktuall auch nicht mehr verwendet)
            const userId = request.params.userId;
            const courseId: string = request.params.courseId;

            MongoDBConnector.getCourseById(courseId)
                .then(CourseRoute.getAllTestsOfCourse)
                .then(CourseRoute.getAllTopicsOfCourse)
                .then(CourseRoute.getAllFilesOfAllCourseTopics)
                .then(function (files) {
                    CourseRoute.files = files;
                    let result: CourseResult = CourseRoute.assembleCourseResult();
                    CourseRoute.sendSuccessResponse(result, response);
                }, function (err) {
                    CourseRoute.sendFailureResponse("Fehler beim Laden des Kurses", err, response);
                });
        });

        //liefert null, falls Nutzer (Student und Prof) keinen Kurs haben
        //liefert für Profs eine Liste mit ihren Kursen (nur die Namen, da ein Prof sonst nichts sieht)
        //liefert für Studenten die Details ihres Kurses (ein Student hat nur einen Kurs, daher direkt die Detailseite laden)
        this.app.get('/courses/user/:userId', (request: Request, response: Response) =>{
            response.setHeader('Content-Type', 'application/json');

            const userId: string = request.params.userId;
            MongoDBConnector.getUserById(userId)
                .then(CourseRoute.assembleUserCourses)
                .then(function(result){
                    CourseRoute.sendSuccessResponse(result, response);
                }, function(err){
                    CourseRoute.sendFailureResponse("Fehler bei der Kursabfrage", err, response);
                });
        });

        this.app.post('/course', (request: Request, response: Response) => {

            //expected data schema from frontend
            let data = {
                'courseName': 'Mein neuer Kurs',
                'courseTopics': [
                    {
                        'topicName': 'Thema1',
                        'topicDescription': 'Beschreibung zu Thema1 in meinem neuen Kurs',
                        'files': [
                            {
                                'fileName': 'Wichtige Hinweise',
                                'visibilityStartDate': '2016-05-18T16:00:00.000Z',
                                'visibilityEndDate': '2018-05-18T16:00:00.000Z',
                                'data': [
                                    117, 64, 19, 32, 45, 66, 78, 50
                                ]
                            }
                        ]
                    },
                    {
                        'topicName': 'Thema2',
                        'topicDescription': 'Beschreibung zu Thema2 in meinem neuen Kurs',
                        'files': [
                            {
                                'fileName': 'So verdienen sie täglich 1000€',
                                'visibilityStartDate': null,
                                'visibilityEndDate': null,
                                'data': [
                                    117, 64, 19, 32, 45, 66, 78, 50
                                ]
                            }
                        ]
                    }
                ],
                'courseQuizs': [
                    {
                        'quizName': 'Blamieren oder Kassieren (Quiz)',
                        'visibilityStartDate': null,
                        'visibilityEndDate': null,
                        'questions': [
                            {
                                'questionText': 'Wie verdienen sie täglich 1000€?',
                                'possibleAnwsers': [
                                    'Ich',
                                    'Weiß',
                                    'es',
                                    'nicht'
                                ],
                                'correctAnwsers': [
                                    2, 4
                                ]
                            },
                            {
                                'questionText': 'Warum fallen Menschen auf Trickbetrüger rein?',
                                'possibleAnwsers': [
                                    'Sie',
                                    'wollen',
                                    'reich',
                                    'werden'
                                ],
                                'correctAnwsers': [
                                    3
                                ]
                            }
                        ]
                    }
                ],
                'courseParticipants' : [
                    '1', '2', '5', '1420252', '1397856'
                ]
            }

            MongoDBConnector.getCourseById('KURS_' + data.courseName)
                .then(function (result) {
                    if (result === null) {
                        //TODO Hier noch error handling? Alles zurück setzen, wenn ein Teil nicht angelegt werden kann?
                        let newCourse = CourseRoute.createCourseRecursively(data);
                        newCourse.save();
                        CourseRoute.sendSuccessResponse("Kurs angelegt", response);
                    } else {
                        CourseRoute.sendFailureResponse("Ein Kurs mit diesem Namen existiert bereits", null, response);
                    }
                }, function (err) {
                    CourseRoute.sendFailureResponse("Fehler beim Abfragen der bestehenden Kurse", err, response);
                });
        });
    }

    private static assembleUserCourses(user: IUserModel): Promise<CourseResult | string[]>{
        const deferred = require('q').defer();

        if(user.Kurse.length === 0){
            deferred.resolve(null);
        }
        else if(user.UserTyp === UserLevel.STUDENT){
            console.log("Kurs = "+user.Kurse[0]);
            MongoDBConnector.getCourseById(user.Kurse[0])
                .then(CourseRoute.getAllTestsOfCourse)
                .then(CourseRoute.getAllTopicsOfCourse)
                .then(CourseRoute.getAllFilesOfAllCourseTopics)
                .then(function (files) {
                    CourseRoute.files = files;
                    deferred.resolve(CourseRoute.assembleCourseResult());
                }, function (err) {
                    console.log("Error: "+err);
                    deferred.reject();
                });
        }else{
            let kurse: string[] = [];
            for(let i = 0; i < user.Kurse.length; i++){
                kurse.push(user.Kurse[i].substr(5));
            }
            deferred.resolve(kurse);
        }

        return deferred.promise;
    }

    private static createCourseRecursively(courseData: any): IKursModel {
        let newCourse = new MongoKurs();
        let topics: any[] = courseData.courseTopics;
        let quizs: any[] = courseData.courseQuizs;

        newCourse._id = 'KURS_' + courseData.courseName;
        newCourse.Titel = courseData.courseName;
        newCourse.Themen = [];
        newCourse.Tests = [];

        for (let i = 0; i < topics.length; i++) {
            newCourse.Themen.push(CourseRoute.createTopicRecursively(topics[i], newCourse._id)._id);
        }
        for (let i = 0; i < quizs.length; i++) {
            newCourse.Tests.push(CourseRoute.createQuizRecursively(quizs[i], newCourse._id)._id);
        }

        CourseRoute.addCourseToUser(courseData);

        return newCourse;
    }

    private static createTopicRecursively(topicData: any, idPrefix: string): IThemaModel {
        let newTopic = new MongoThema();
        let files: any[] = topicData.files;

        newTopic._id = idPrefix + '_' + topicData.topicName;
        newTopic.Titel = topicData.topicName;
        newTopic.Text = topicData.topicDescription;
        newTopic.Dateien = [];
        for (let i = 0; i < topicData.files.length; i++) {
            newTopic.Dateien.push(CourseRoute.createFileRecursively(topicData.files[i], newTopic._id)._id);
        }

        newTopic.save();
        return newTopic;
    }

    private static createFileRecursively(fileData: any, idPrefix: string): IDateiModel {
        let newFile = new MongoDatei();

        newFile._id = idPrefix + '_' + fileData.fileName;
        newFile.Titel = fileData.fileName;

        fileData.visibilityStartDate === null ? newFile.Anfangsdatum = null :
            newFile.Anfangsdatum = new Date(fileData.visibilityStartDate);
        fileData.visibilityEndDate === null ? newFile.Ablaufdatum = null :
            newFile.Ablaufdatum = new Date(fileData.visibilityEndDate);
        newFile.gridfsLink = CourseRoute.saveFile(fileData.data, newFile.Titel, newFile._id);

        newFile.save();
        return newFile;
    }

    private static saveFile(file: any, filename: string, idPrefix: string): string {
        const tmpFileName = "tmp_up_" + filename;
        const id = idPrefix + '_ActualData';

        filesystem.writeFile(tmpFileName, Buffer.from(file), function (err) {
            let fileStream = MongoDBConnector.saveFileWithId(id, filename, tmpFileName);
            fileStream.on('close', function (file) {
                filesystem.unlinkSync(tmpFileName);
            });
        });

        return id;
    }

    private static createQuizRecursively(quizData: any, idPrefix: string): ITestModel {
        let newQuiz = new MongoTest();

        newQuiz._id = idPrefix + '_' + quizData.quizName;
        newQuiz.Titel = quizData.quizName;
        quizData.visibilityStartDate === null ? newQuiz.Anfangsdatum = null :
            newQuiz.Anfangsdatum = new Date(quizData.visibilityStartDate);
        quizData.visibilityEndDate === null ? newQuiz.Ablaufdatum = null :
            newQuiz.Ablaufdatum = new Date(quizData.visibilityEndDate);
        newQuiz.AbgeschlossenVon = [];
        newQuiz.Fragen = [];
        for (let i = 0; i < quizData.questions.length; i++) {
            newQuiz.Fragen.push(CourseRoute.createQuestionRecursively(quizData.questions[i], (newQuiz._id + '_Frage' + i))._id);
        }

        newQuiz.save();
        return newQuiz;
    }

    private static createQuestionRecursively(questionData: any, id: string): IFrageModel {
        let newQuestion = new MongoFrage();

        newQuestion._id = id;
        newQuestion.Fragetext = questionData.questionText;
        newQuestion.Antworten = questionData.possibleAnwsers;
        newQuestion.KorrekteAntwortenIndex = questionData.correctAnwsers;

        newQuestion.save();
        return newQuestion;
    }

    private static addCourseToUser(courseData: any): void{
        const courseId: string = 'KURS_'+courseData.courseName;

        for(let i = 0; i < courseData.courseParticipants.length; i++){
            let userId:string = courseData.courseParticipants[i];
            MongoUser.findOneAndUpdate({_id: userId}, {$push:{Kurse: courseId}});
        }
    }

    private static assembleCourseResult(): CourseResult {
        const courseResult: CourseResult = new CourseResult(CourseRoute.course._id, CourseRoute.course.Titel);
        const courseTopics: Topic[] = new Array(CourseRoute.topics.length);
        const courseFiles: FileMetadata[] = [];
        const courseTests: QuizMetadata[] = [];
        let now: Date = new Date();

        for (let quizCounter = 0; quizCounter < CourseRoute.tests.length; quizCounter++) {
            if (CourseRoute.isFileInVisibleNow(CourseRoute.tests[quizCounter].Anfangsdatum,
                    CourseRoute.tests[quizCounter].Ablaufdatum)) {
                courseTests.push(new QuizMetadata(CourseRoute.tests[quizCounter]._id,
                    CourseRoute.tests[quizCounter].Titel));
            }
        }

        for (let fileCounter = 0; fileCounter < CourseRoute.files.length; fileCounter++) {
            if (CourseRoute.isFileInVisibleNow(CourseRoute.files[fileCounter].Anfangsdatum,
                    CourseRoute.files[fileCounter].Ablaufdatum)) {
                courseFiles.push(new FileMetadata(CourseRoute.files[fileCounter]._id,
                    CourseRoute.files[fileCounter].Titel, "FileLinkNotExistingYet"));
            }
        }

        for (let topicCounter = 0; topicCounter < courseTopics.length; topicCounter++) {
            const tmpTopic = new Topic(CourseRoute.topics[topicCounter]._id, CourseRoute.topics[topicCounter].Titel,
                CourseRoute.topics[topicCounter].Text);
            const topicFiles: FileMetadata[] = new Array();
            const thisTopicFileIds: string[] = CourseRoute.topics[topicCounter].Dateien;

            for (let fileCounter = 0; fileCounter < courseFiles.length; fileCounter++) {
                for (let fileIdsCounter = 0; fileIdsCounter < thisTopicFileIds.length; fileIdsCounter++) {
                    if (thisTopicFileIds[fileIdsCounter] === CourseRoute.files[fileCounter].id) {
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

        return courseResult;
    }

    private static isFileInVisibleNow(visibilityStart: Date, visibilityEnd: Date): boolean {
        let now: Date = new Date();

        return ((visibilityStart === null && visibilityEnd === null) ||
            ((visibilityStart <= now) && (visibilityEnd >= now)));
    }

    private static getAllTestsOfCourse(course: IKursModel): Promise<ITestModel[]> {
        CourseRoute.course = course;
        console.log("Kursobjekt = "+course);
        return MongoDBConnector.getTestsByIds(course.Tests);
    }

    private static getAllTopicsOfCourse(tests: ITestModel[]): Promise<IThemaModel[]> {
        CourseRoute.tests = tests;
        return MongoDBConnector.getTopicsByIds(CourseRoute.course.Themen);
    }

    private static getAllFilesOfAllCourseTopics(topics: IThemaModel[]): Promise<IDateiModel[]> {
        CourseRoute.topics = topics;
        let fileIds: string[] = [];

        for (let i = 0; i < topics.length; i++) {
            for (let f = 0; f < topics[i].Dateien.length; f++) {
                fileIds.push(topics[i].Dateien[f]);
            }
        }

        return MongoDBConnector.getFilesMetadataByIds(fileIds);
    }

}
