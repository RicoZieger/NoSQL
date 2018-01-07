import { Route } from "../../interfaces/Route";
import { Request, Response } from "express";
import { IThemaModel, MongoThema } from "../../models/Thema";
import { IDateiModel, MongoDatei } from "../../models/Datei";
import { IKursModel, MongoKurs } from "../../models/Kurs";
import { ITestModel, MongoTest } from "../../models/Test";
import { IFrageModel, MongoFrage } from "../../models/Frage";
import { IUserModel, MongoUser } from "../../models/User";
import {
    CourseMetadata, CourseResult, FileMetadata, NewCourse, NewFile, NewQuestion, NewQuiz, NewTopic, QuizMetadata,
    Topic, UserLevel
} from "../../interfaces/Results";
import { MongoDBConnector } from "../../DBConnectors/MongoDBConnector";
import filesystem = require('fs');

export class CourseRoute extends Route {

    getRoutes(): void {
        //liefert die Details zu dem angegebenen Kurs
        //NOTE Nur Nutzer, die auch in den Kurs eingeschrieben sind, sind berechtigt.
        this.app.get('/users/:userId/courses/:courseId', (request: Request, response: Response) => {
            const userId = request.params.userId;
            const courseId: string = request.params.courseId;
            let course: IKursModel;
            let topics: IThemaModel[] = [];
            let tests: ITestModel[] = [];
            let user : IUserModel;

            CourseRoute.hasUserAccessToCourseDetails(userId, request.header('request-token'), courseId)
            .then(function(hasAccess){
                return userId;;
            })
            .then(MongoDBConnector.getUserById)
            .then(function(userResult){
                user = userResult;
                return courseId;
            })
            .then(MongoDBConnector.getCourseById)
            .then(function(courseResult){
                course = courseResult;
                return courseResult.Tests;
            })
            .then(MongoDBConnector.getTestsByIds)
            .then(function(testsResult){
                tests = testsResult;
                return course.Themen;
            })
            .then(MongoDBConnector.getTopicsByIds)
            .then(function(topicsResult){
                topics = topicsResult;
                return topicsResult;
            })
            .then(CourseRoute.getAllFilesOfAllCourseTopics)
            .then(function (files) {
                let result: CourseResult = CourseRoute.assembleCourseResult(user, course, tests, topics, files);
                CourseRoute.sendSuccessResponse(result, response);
            }, function (err) {
                CourseRoute.sendFailureResponse("Fehler beim Laden des Kurses", err, response);
            });
        });

        // liefert eine Liste an Kursmetadaten (Titel und id) für den angegebenen Nutzer
        //NOTE Jeder Nutzer mit gültigem Token ist berechtigt, auch wenn nur Admins diesen Aufruf machen werden.
        this.app.get('/users/:userId/courses', (request: Request, response: Response) =>{
            const userId: string = request.params.userId;
            CourseRoute.isTokenValid(userId, request.header('request-token'))
            .then(function(isValid){
                return userId;
            })
            .then(MongoDBConnector.getUserById)
            .then(CourseRoute.assembleUserCourses)
            .then(function(result){
                CourseRoute.sendSuccessResponse(result, response);
            }, function(err){
                CourseRoute.sendFailureResponse("Fehler bei der Kursabfrage", err, response);
            });
        });

        //legt einen neuen Kurs an
        //NOTE Nur Admins sind berechtigt
        this.app.post('/users/:userId/courses', (request: Request, response: Response) => {
            let data: NewCourse = request.body as NewCourse;

            CourseRoute.isTokenValid(request.params.userId, request.header('request-token'))
            .then(function(isTokenValid){
                return request.params.userId;
            })
            .then(CourseRoute.isUserAdmin)
            .then(function(isAdmin){
                return data.name;
            })
            .then(MongoDBConnector.getCourseById)
            .then(function (result) {
                if (result === null) {
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

    private static assembleUserCourses(user: IUserModel): CourseMetadata[]{
        if(user.Kurse.length === 0){
            return null;
        }else{
            let kurse: CourseMetadata[] = [];
            for(let i = 0; i < user.Kurse.length; i++){
                kurse.push(new CourseMetadata(user.Kurse[i], user.Kurse[i]));
            }
            return kurse;
        }
    }

    private static createCourseRecursively(course: NewCourse): IKursModel {
        let newCourse = new MongoKurs();
        let topics: NewTopic[] = course.topics;
        let quizs: NewQuiz[] = course.quizs;

        newCourse._id = course.name;
        newCourse.Titel = course.name;
        newCourse.Themen = [];
        newCourse.Tests = [];

        for (let i = 0; i < topics.length; i++) {
            newCourse.Themen.push(CourseRoute.createTopicRecursively(topics[i], newCourse._id, i)._id);
        }
        for (let i = 0; i < quizs.length; i++) {
            newCourse.Tests.push(CourseRoute.createQuizRecursively(quizs[i], newCourse._id, i)._id);
        }

        CourseRoute.addCourseToUser(course);

        return newCourse;
    }

    private static createTopicRecursively(topic: NewTopic, idPrefix: string, topicNumber: number): IThemaModel {
        let newTopic = new MongoThema();
        let files: NewFile[] = topic.files;

        newTopic._id = idPrefix + '_Thema' + topicNumber;
        newTopic.Titel = topic.name;
        newTopic.Text = topic.description;
        newTopic.Dateien = [];
        for (let i = 0; i < topic.files.length; i++) {
            newTopic.Dateien.push(CourseRoute.createFileRecursively(topic.files[i], newTopic._id, i)._id);
        }

        newTopic.save();
        return newTopic;
    }

    private static createFileRecursively(file: NewFile, idPrefix: string, fileNumber: number): IDateiModel {
        let newFile = new MongoDatei();

        newFile._id = idPrefix + '_Datei' + fileNumber;
        newFile.Titel = file.name;

        file.visibilityStartDate === null ? newFile.Anfangsdatum = null :
            newFile.Anfangsdatum = file.visibilityStartDate;
        file.visibilityEndDate === null ? newFile.Ablaufdatum = null :
            newFile.Ablaufdatum = file.visibilityEndDate;
        newFile.gridfsLink = CourseRoute.saveFile(file.data, newFile.Titel, newFile._id);

        newFile.save();
        return newFile;
    }

    private static saveFile(filedata: any, filename: string, idPrefix: string): string {
        const tmpFileName = "tmp_up_" + filename;
        const id = idPrefix + '_ActualData';

        filesystem.writeFile(tmpFileName, new Buffer(filedata.split(",")[1], 'base64'), function (err) {
            let fileStream = MongoDBConnector.saveFileWithId(id, filename, tmpFileName);
            fileStream.on('close', function (file) {
                filesystem.unlinkSync(tmpFileName);
            });
        });

        return id;
    }

    private static createQuizRecursively(quiz: NewQuiz, idPrefix: string, quizNumber: number): ITestModel {
        let newQuiz = new MongoTest();

        newQuiz._id = idPrefix + '_Test' + quizNumber;
        newQuiz.Titel = quiz.name;
        quiz.visibilityStartDate === null ? newQuiz.Anfangsdatum = null :
            newQuiz.Anfangsdatum = quiz.visibilityStartDate;
        quiz.visibilityEndDate === null ? newQuiz.Ablaufdatum = null :
            newQuiz.Ablaufdatum = quiz.visibilityEndDate;
        newQuiz.AbgeschlossenVon = [];
        newQuiz.Fragen = [];
        for (let i = 0; i < quiz.questions.length; i++) {
            newQuiz.Fragen.push(CourseRoute.createQuestionRecursively(quiz.questions[i],
                (newQuiz._id + '_Frage' + i))._id);
        }

        newQuiz.save();
        return newQuiz;
    }

    private static createQuestionRecursively(question: NewQuestion, id: string): IFrageModel {
        let newQuestion = new MongoFrage();

        newQuestion._id = id;
        newQuestion.Fragetext = question.questionText;
        newQuestion.Antworten = question.possibleAnwsers;
        newQuestion.KorrekteAntwortenIndex = question.correctAnwsers;

        newQuestion.save();
        return newQuestion;
    }

    private static addCourseToUser(course: NewCourse): void{
        const courseId: string = course.name;

        for(let i = 0; i < course.users.length; i++){
            let userId:string = course.users[i];
            MongoUser.findOneAndUpdate({_id: userId}, {$push:{Kurse: courseId}}, function(err, doc, res){
                if(doc != null && ((doc.UserTyp === UserLevel.STUDENT && doc.Kurse.length === 0)
                    || (doc.UserTyp === UserLevel.PROFESSOR && doc.Kurse.indexOf(courseId) === -1))){                    
                    doc.save();
                }
            });
        }
    }

    private static assembleCourseResult(user: IUserModel, course: IKursModel, tests: ITestModel[], topics: IThemaModel[],
        files: IDateiModel[]): CourseResult {
        const courseResult: CourseResult = new CourseResult(course._id, course.Titel);
        const courseTopics: Topic[] = new Array(topics.length);
        const courseFiles: FileMetadata[] = [];
        const courseTests: QuizMetadata[] = [];
        let now: Date = new Date();

        for (let quizCounter = 0; quizCounter < tests.length; quizCounter++) {
            if (CourseRoute.isFileInVisibleNow(tests[quizCounter].Anfangsdatum, tests[quizCounter].Ablaufdatum) &&
                (user.Testergebnisse.indexOf((tests[quizCounter]._id+'_Ergebnis_'+user._id)) === -1)) {
                courseTests.push(new QuizMetadata(tests[quizCounter]._id, tests[quizCounter].Titel));
            }
        }

        for (let fileCounter = 0; fileCounter < files.length; fileCounter++) {
            if (CourseRoute.isFileInVisibleNow(files[fileCounter].Anfangsdatum, files[fileCounter].Ablaufdatum)) {
                courseFiles.push(new FileMetadata(files[fileCounter]._id, files[fileCounter].Titel,
                    files[fileCounter].gridfsLink));
            }
        }

        for (let topicCounter = 0; topicCounter < courseTopics.length; topicCounter++) {
            const tmpTopic = new Topic(topics[topicCounter]._id, topics[topicCounter].Titel, topics[topicCounter].Text);
            const topicFiles: FileMetadata[] = new Array();
            const thisTopicFileIds: string[] = topics[topicCounter].Dateien;

            for (let fileCounter = 0; fileCounter < courseFiles.length; fileCounter++) {
                for (let fileIdsCounter = 0; fileIdsCounter < thisTopicFileIds.length; fileIdsCounter++) {
                    if (thisTopicFileIds[fileIdsCounter] === files[fileCounter].id) {
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
            (visibilityStart === null && visibilityEnd != null && visibilityEnd >= now) ||
            (visibilityEnd === null && visibilityStart != null && visibilityStart <= now) ||
            (visibilityStart != null && visibilityEnd != null && visibilityStart <= now && visibilityEnd >= now));
    }

    private static getAllFilesOfAllCourseTopics(topics: IThemaModel[]): Promise<IDateiModel[]> {
        let fileIds: string[] = [];

        for (let i = 0; i < topics.length; i++) {
            for (let f = 0; f < topics[i].Dateien.length; f++) {
                fileIds.push(topics[i].Dateien[f]);
            }
        }

        return MongoDBConnector.getFilesMetadataByIds(fileIds);
    }

    private static hasUserAccessToCourseDetails(userId: string, token: string, courseId: string): Promise<boolean> {
        const deferred = require('q').defer();

        CourseRoute.isTokenValid(userId, token)
        .then(function(isTokenValid){
            return userId;
        })
        .then(MongoDBConnector.getUserById)
        .then(function(user){
            return (user.Kurse.indexOf(courseId) > -1) ? deferred.resolve(true) :
                deferred.reject("Der Nutzer ist nicht in diesen Kurs eingeschrieben");
        }, function(err){
            deferred.reject(err);
        });

        return deferred.promise;
    }

}
