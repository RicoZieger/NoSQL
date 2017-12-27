import { Route } from "../../interfaces/Route";
import { Request, Response } from "express";
import { Message, Question, Quiz, Status, QuizResult, UserAnswer } from "../../interfaces/Results";
import { MongoDBConnector } from "../../DBConnectors/MongoDBConnector";
import { ITestModel, mongoTest} from "../../models/Test";
import { IFrageModel, mongoFrage} from "../../models/Frage";
import { ITestergebnisModel, mongoTestergebnis} from "../../models/Testergebnis";

export class QuizRoute extends Route {

    private static test: ITestModel;
    private static questions: IFrageModel[];

    getRoutes(): void {
        this.app.get('/user/:userId/course/:courseId/quiz/:quizId', (request: Request, response: Response) => {
            response.setHeader('Content-Type', 'application/json');

            //TODO userId und courseId können entfallen, da ein Test über seine Id eindeutig aufgefunden werden kann.
            //(beide Werte werden hier auch nicht verwendet)
            const userId = request.params.userId;
            const courseId = request.params.courseId;
            const quizId = request.params.quizId;

            MongoDBConnector.getTestById(quizId)
                .then(QuizRoute.getAllQuestions)
                .then(function(questions){
                    QuizRoute.questions = questions;
                    let quizResult: Quiz = QuizRoute.assembleQuiz();
                    QuizRoute.sendSuccessResponse(quizResult, response);
                },function(err){
                    QuizRoute.sendFailureResponse("Fehler beim Laden des Tests", err, response);
                });
        });

        this.app.post('/user/:userId/course/:courseId/quiz/quizId', (request: Request, response: Response) =>{
            response.setHeader('Content-Type', 'application/json');

            //TODO courseId kann hier entfallen, da der Test über seine Id ja schon eindeutig referenziert wird.
            const userId = request.params.userId;
            const courseId = request.params.courseId;
            const quizId = request.params.quizId;

            //TODO so oder wie auch immer das QuizResult Objekt aus dem Body auslesen.
            const quizResult: QuizResult = request.body as QuizResult;

            MongoDBConnector.getTestById(quizId)
                .then(QuizRoute.getAllQuestions)
                .then(function(questions: IFrageModel[]){
                    let testergebnisModel: ITestergebnisModel = QuizRoute.assembleTestergebnisModel(quizResult, questions, userId);
                    testergebnisModel.save()
                        .then(function(value){
                            QuizRoute.updateUserTests(userId, quizId)
                                .then(function(success){
                                    QuizRoute.sendSuccessResponse(null, response);
                                },
                                function(err){
                                    testergebnisModel.remove();
                                    QuizRoute.sendFailureResponse("Fehler beim Speichern des Testergebnisses", err, response);
                                });
                        }, function(err){
                            QuizRoute.sendFailureResponse("Fehler beim Speichern des Testergebnisses", err, response);
                        });
                }, function(err){
                    QuizRoute.sendFailureResponse("Fehler beim Abfragen der Testergebnisse", err, response);
                });
        });
    }

    private static getAllQuestions(question: ITestModel): Promise<IFrageModel[]> {
        return MongoDBConnector.getQuestionsByIds(question.Fragen);
    }

    private static assembleQuiz(): Quiz{
        let questions: Question[] = new Array();

        for(var i = 0; i < QuizRoute.questions.length; i++){
            questions.push(new Question(QuizRoute.questions[i]._id, QuizRoute.questions[i].Fragetext,
                QuizRoute.questions[i].Antworten));
        }

        return new Quiz(QuizRoute.test._id, QuizRoute.test.Titel, questions);
    }

    private static assembleTestergebnisModel(quizResult: QuizResult, questions: IFrageModel[], userId: string): ITestergebnisModel{
        let testergebnis: ITestergebnisModel;
        let userPoints: number = 0;

        testergebnis._id = 'TESTERGEBNIS_'+quizResult.quizId+'_'+userId;
        testergebnis.ZugehörigerTest = quizResult.quizId;
        testergebnis.ZugehörigerUser = userId;

        for(let i = 0; i < questions.length; i++){
            for(let x = 0; x < quizResult.answers.length; x++){
                if(quizResult.answers[x].questionId === questions[i]._id){
                    for(let t = 0; t < quizResult.answers[x].givenAnswerIndizies.length; t++){
                        if(QuizRoute.containsArrayNumber(questions[i].KorrekteAntwortenIndex, quizResult.answers[x].givenAnswerIndizies[t])){
                            userPoints++;
                        }
                    }
                }
            }
        }
        testergebnis.ErreichtePunkte = 10;

        return testergebnis;
    }

    private static containsArrayNumber(array: number[], number: number): boolean{
        for(let i = 0; i < array.length; i++){
            if(array[i] === number){
                return true;
            }
        }

        return false;
    }

    private static updateUserTests(userId: string, quizId: string): Promise<ITestModel>{
        const deferred = require('q').defer();

        MongoDBConnector.getTestById(quizId)
            .then(function(test){
                test.AbgeschlossenVon.push(userId);
                return test.save();
            }, function(err){
                return deferred.reject();
            });

        return deferred.promise;
    }

}
