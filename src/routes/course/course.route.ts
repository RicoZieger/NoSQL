import { Route } from "../../interfaces/Route";
import { Request, Response } from "express";
import { IUserModel, mongoUser } from "../../models/User";
import { IThemaModel, mongoThema } from "../../models/Thema";
import { IDateiModel, mongoDatei } from "../../models/Datei";
import { IKursModel, mongoKurs } from "../../models/Kurs";
import { ITestModel, mongoTest } from "../../models/Test";
import { CourseResult, FileMetadata, Message, QuizMetadata, Status, Topic } from "../../interfaces/Results";
import { MongoDBConnector } from "../../DBConnectors/MongoDBConnector";

export class CourseRoute extends Route {

    private static course: IKursModel;
    private static topics: IThemaModel[];
    private static tests: ITestModel[];
    private static files: IDateiModel[];

    getRoutes(): void {
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
                .then(function(files){
                    CourseRoute.files = files;
                    let result: CourseResult = CourseRoute.assembleCourseResult();
                    CourseRoute.sendSuccessResponse(result, response);
                }, function(err){
                    CourseRoute.sendFailureResponse("Fehler beim Laden des Kurses", err, response);
                });
        });

        this.app.post('/course', (request: Request, response: Response) =>{

            //expected data schema from frontend
            let data = {
                'courseName': 'Mein neuer Kurs',
                'courseTopics': [
                    {
                        'topicName':'Thema1',
                        'topicDescription':'Beschreibung zu Thema1 in meinem neuen Kurs',
                        'files':[
                            {
                                'fileName':'Wichtige Hinweise',
                                'visibilityStartDate': '2016-05-18T16:00:00.000Z',
                                'visibilityEndDate': '2018-05-18T16:00:00.000Z',
                                'data':[
                                    117,64,19,32,45,66,78,50
                                ]
                            }
                        ]
                    },
                    {
                        'topicName':'Thema2',
                        'topicDescription':'Beschreibung zu Thema2 in meinem neuen Kurs',
                        'files':[
                            {
                                'fileName':'So verdienen sie täglich 1000€',
                                'visibilityStartDate': null,
                                'visibilityEndDate': null,
                                'data':[
                                    117,64,19,32,45,66,78,50
                                ]
                            }
                        ]
                    }
                ],
                'courseQuizs':[
                    {
                        'quizName':'Blamieren oder Kassieren (Quiz)',
                        'visibilityStartDate': null,
                        'visibilityEndDate': null,
                        'questions':[
                            {
                                'questionText': 'Wie verdienen sie täglich 1000€?',
                                'possibleAnwsers': [
                                    'Ich',
                                    'Weiß',
                                    'es',
                                    'nicht'
                                ],
                                'correctAnwsers':[
                                    2,4
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
                                'correctAnwsers':[
                                    3
                                ]
                            }
                        ]
                    }
                ]
            }

            console.log("Create new course");

        });
    }

    private static assembleCourseResult(): CourseResult{
        const courseResult: CourseResult = new CourseResult(CourseRoute.course._id, CourseRoute.course.Titel);
        const courseTopics: Topic[] = new Array(CourseRoute.topics.length);
        const courseFiles: FileMetadata[] = [];
        const courseTests: QuizMetadata[] = [];
        let now: Date = new Date();

        for (let quizCounter = 0; quizCounter < CourseRoute.tests.length; quizCounter++) {
            if(CourseRoute.isFileInVisibleNow(CourseRoute.tests[quizCounter].Anfangsdatum,
                CourseRoute.tests[quizCounter].Ablaufdatum)){
                courseTests.push(new QuizMetadata(CourseRoute.tests[quizCounter]._id,
                    CourseRoute.tests[quizCounter].Titel));
            }
        }

        for (let fileCounter = 0; fileCounter < CourseRoute.files.length; fileCounter++) {
            if(CourseRoute.isFileInVisibleNow(CourseRoute.files[fileCounter].Anfangsdatum,
                CourseRoute.files[fileCounter].Ablaufdatum)){
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

    private static isFileInVisibleNow(visibilityStart: Date, visibilityEnd: Date): boolean{
        let now: Date = new Date();

        return ((visibilityStart === null && visibilityEnd === null) ||
        ((visibilityStart <= now) && (visibilityEnd >= now)));
    }

    private static getAllTestsOfCourse(course: IKursModel): Promise<ITestModel[]>{
        CourseRoute.course = course;
        return MongoDBConnector.getTestsByIds(course.Tests);
    }

    private static getAllTopicsOfCourse(tests: ITestModel[]): Promise<IThemaModel[]>{
        CourseRoute.tests = tests;
        return MongoDBConnector.getTopicsByIds(CourseRoute.course.Themen);
    }

    private static getAllFilesOfAllCourseTopics(topics: IThemaModel[]): Promise<IDateiModel[]>{
        CourseRoute.topics = topics;
        let fileIds: string[] = new Array();

        for(let i = 0; i < topics.length; i++){
            for(let f = 0; f < topics[i].Dateien.length; f++){
                fileIds.push(topics[i].Dateien[f]);
            }
        }

        return MongoDBConnector.getFilesMetadataByIds(fileIds);
    }

}
