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
    Topic
} from "../../interfaces/Results";
import { MongoDBConnector } from "../../DBConnectors/MongoDBConnector";
import filesystem = require('fs');

export class CourseRoute extends Route {

    private static course: IKursModel;
    private static topics: IThemaModel[];
    private static tests: ITestModel[];
    private static files: IDateiModel[];

    getRoutes(): void {
        //liefert die Details zu dem angegebenen Kurs
        //TODO prüfen, ob der user mit der angegebenen Id die Berechtigung dazu hat
        this.app.get('/users/:userId/courses/:courseId', (request: Request, response: Response) => {

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

        // liefert eine Liste an Kursmetadaten (Titel und id) für den angegebenen Nutzer
        //TODO prüfen, ob der user mit der angegebenen Id die Berechtigung dazu hat
        this.app.get('/users/:userId/courses', (request: Request, response: Response) =>{
            const userId: string = request.params.userId;
            MongoDBConnector.getUserById(userId)
                .then(CourseRoute.assembleUserCourses)
                .then(function(result){
                    CourseRoute.sendSuccessResponse(result, response);
                }, function(err){
                    CourseRoute.sendFailureResponse("Fehler bei der Kursabfrage", err, response);
                });
        });

        //legt einen neuen Kurs an
        //TODO prüfen, ob der user mit der angegebenen Id die Berechtigung dazu hat
        //TODO error handling ? Alles zurück setzen?
        this.app.post('/users/:userId/courses', (request: Request, response: Response) => {
            let data: NewCourse = request.body as NewCourse;

            MongoDBConnector.getCourseById(data.name)
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

        filesystem.writeFile(tmpFileName, Buffer.from(filedata), function (err) {
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
            newQuiz.Fragen.push(CourseRoute.createQuestionRecursively(quiz.questions[i], (newQuiz._id + '_Frage' + i))._id);
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
                if(doc != null)
                    doc.save();
            });
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
