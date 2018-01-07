import { Route } from "../../interfaces/Route";
import { Request, Response } from "express";
import { Question, Quiz, QuizResult } from "../../interfaces/Results";
import { MongoDBConnector } from "../../DBConnectors/MongoDBConnector";
import { ITestModel, MongoTest } from "../../models/Test";
import { IFrageModel } from "../../models/Frage";
import { IUserModel, MongoUser } from "../../models/User";
import { ITestergebnisModel, MongoTestergebnis } from "../../models/Testergebnis";

export class QuizRoute extends Route {

    getRoutes(): void {
        //liefert den angegebenen Tests
        //NOTE Nur Studenten, die in den Kurs eingeschrieben sind, zu dem der Test gehört, sind berechtigt.
        this.app.get('/users/:userId/quizs/:quizId', (request: Request, response: Response) => {
            const userId = request.params.userId;
            const quizId = request.params.quizId;
            let testModel: ITestModel;

            QuizRoute.hasUserAccessToQuizDetails(userId, request.header('request-token'), quizId)
            .then(function(hasAccess){
                return quizId;
            })
            .then(MongoDBConnector.getTestById)
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
        // NOTE Nur Studenten, die zu diesem Test noch kein Testergebnis haben, sind berechtigt.
        this.app.post('/users/:userId/quizs', (request: Request, response: Response) =>{
            const userId = request.params.userId;
            const quizResult: QuizResult = request.body as QuizResult;

            QuizRoute.hasUserAccessToCreateQuizResult(userId, request.header('request-token'), quizResult.quizId)
            .then(function(hasAccess){
                return quizResult.quizId;
            })
            .then(MongoDBConnector.getTestById)
            .then(QuizRoute.getAllQuestions)
            .then(function(questions: IFrageModel[]){
                let testergebnisModel: ITestergebnisModel = QuizRoute.assembleTestergebnisModel(quizResult, questions, userId);
                testergebnisModel.save()
                .then(function(success){
                    QuizRoute.updateQuiz(userId, quizResult.quizId)
                    .then(function(success){
                        QuizRoute.updateUser(userId, quizResult.quizId)
                        .then(function(success){
                            QuizRoute.sendSuccessResponse("Das Testergebnis wurde erfolgreich angelegt", response);
                        }, function(err){
                            QuizRoute.sendFailureResponse("Fehler beim Speichern des Testergebnisses", err, response);
                        });
                    }, function(err){
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

        questionArray.sort(function(a, b) {
            return a._id.localeCompare(b._id);
        });

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
                        if(QuizRoute.containsArrayNumber(questions[i].KorrekteAntwortenIndex,
                            quizResult.answers[x].givenAnswerIndizies[t])){
                            userPoints++;
                        }
                    }
                }
            }
        }
        testergebnis.ErreichtePunkte = userPoints;

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

    private static updateQuiz(userId: string, quizId: string): Promise<ITestModel>{
        const deferred = require('q').defer();

         MongoTest.findOneAndUpdate({_id: quizId}, {$push:{AbgeschlossenVon: userId}}, function(err, doc, res){
            if(doc != null)
                return deferred.resolve(doc.save());
            else
                return deferred.reject(err);
         });

        return deferred.promise;
    }

    private static updateUser(userId: string, quizId: string): Promise<ITestModel>{
        const deferred = require('q').defer();

         MongoUser.findOneAndUpdate({_id: userId}, {$push:{Testergebnisse: (quizId+"_Ergebnis_"+userId)}}, function(err, doc, res){
            if(doc != null)
                return deferred.resolve(doc.save());
            else
                return deferred.reject(err);
         });

        return deferred.promise;
    }

    private static hasUserAccessToQuizDetails(userId: string, token: string, quizId: string): Promise<boolean> {
        const deferred = require('q').defer();

        QuizRoute.isTokenValid(userId, token)
        .then(function(isTokenValid){
            return userId;
        })
        .then(QuizRoute.isUserStudent)
        .then(function(isStudent){
            return userId;
        })
        .then(MongoDBConnector.getUserById)
        .then(function(user){
            return (user.Kurse[0] === quizId.substring(0, quizId.indexOf("_"))) ? deferred.resolve(true) :
                deferred.reject("Der Nutzer ist nicht in den zu diesem Test gehörigen Kurs eingeschrieben und daher"+
                    " auch nicht zur Ansicht und Durchführung dieses Tests berechtigt.");
        }, function(err){
            deferred.reject(err);
        });

        return deferred.promise;
    }

    private static hasUserAccessToCreateQuizResult(userId: string, token: string, quizId: string): Promise<boolean> {
        const deferred = require('q').defer();

        QuizRoute.isTokenValid(userId, token)
        .then(function(isTokenValid){
            return userId;
        })
        .then(QuizRoute.isUserStudent)
        .then(function(isStudent){
            return userId;
        })
        .then(MongoDBConnector.getUserById)
        .then(function(user){
            return (user.Testergebnisse.indexOf(quizId+"_Ergebnis_"+userId) === -1 ) ? deferred.resolve(true) :
                deferred.reject("Der Nutzer hat bereits ein Testergebnis zu diesem Test und ist daher nicht zum erneuten"+
                    " Anlegen eines Testergebnisses berechtigt.");
        }, function(err){
            deferred.reject(err);
        });

        return deferred.promise;
    }

}
