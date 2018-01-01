import { Route } from "../../interfaces/Route";
import { Request, Response } from "express";
import { Question, Quiz, QuizResult } from "../../interfaces/Results";
import { MongoDBConnector } from "../../DBConnectors/MongoDBConnector";
import { ITestModel } from "../../models/Test";
import { IFrageModel } from "../../models/Frage";
import { ITestergebnisModel, MongoTestergebnis } from "../../models/Testergebnis";

export class QuizRoute extends Route {

    getRoutes(): void {
        //liefert den angegebenen Tests
        //TODO prüfen, ob der angegebene Nutzer eine Berechtigung hat
        this.app.get('/users/:userId/quizs/:quizId', (request: Request, response: Response) => {
            const userId = request.params.userId;
            const quizId = request.params.quizId;
            let testModel: ITestModel;

            MongoDBConnector.getTestById(quizId)
                .then(function(quiz){
                    testModel = quiz;
                    return quiz;
                })
                .then(QuizRoute.getAllQuestions)
                .then(function(questions){
                    let quizResult: Quiz = QuizRoute.assembleQuiz(questions, testModel);
                    QuizRoute.sendSuccessResponse(quizResult, response);
                },function(err){
                    QuizRoute.sendFailureResponse("Fehler beim Laden des Tests", err, response);
                });
        });

        // legt ein Testergebnis für den angegebenen Nutzer an
        // TODO prüfen, ob der angegebene Nutzer die Berechtigung dazu hat
        this.app.post('/users/:userId/quizs', (request: Request, response: Response) =>{
            const userId = request.params.userId;
            const quizResult: QuizResult = request.body as QuizResult;

            MongoDBConnector.getTestById(quizResult.quizId)
                .then(QuizRoute.getAllQuestions)
                .then(function(questions: IFrageModel[]){
                    let testergebnisModel: ITestergebnisModel = QuizRoute.assembleTestergebnisModel(quizResult, questions, userId);
                    testergebnisModel.save()
                        .then(function(value){
                            QuizRoute.updateUserTests(userId, quizResult.quizId)
                                .then(function(success){
                                    QuizRoute.sendSuccessResponse("Das Testergebnis wurde erfolgreich angelegt", response);
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

    private static assembleQuiz(questions: IFrageModel[], quiz: ITestModel): Quiz{
        let questionArray: Question[] = new Array();

        for(var i = 0; i < questions.length; i++){
            questionArray.push(new Question(questions[i]._id, questions[i].Fragetext, questions[i].Antworten));
        }

        return new Quiz(quiz._id, quiz.Titel, questionArray);
    }

    private static assembleTestergebnisModel(quizResult: QuizResult, questions: IFrageModel[], userId: string): ITestergebnisModel{
        let testergebnis = new MongoTestergebnis();
        let userPoints: number = 0;

        testergebnis._id = quizResult.quizId+'_Ergebnis_'+userId;
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

//TODO findOneAndUpdate nutzen
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
