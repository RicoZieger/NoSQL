import { Request, Response } from "express";
import { Route } from "../../interfaces/Route";
import { MongoDBConnector } from "../../DBConnectors/MongoDBConnector";
import { QuizUserResult } from "../../interfaces/Results";
import { IUserModel } from "../../models/User";
import { ITestergebnisModel } from "../../models/Testergebnis";

export class DashboardRoute extends Route {

    public getRoutes(): void {
        //returns the test results for all students in the given course/quiz)
        //NOTE Nur Admins, die in den zum angegebenen Test zugehörigen Kurs eingeschrieben sind, sind berechtigt.
        this.app.get('/dashboards/users/:userId/courses/:courseId/quizs/:quizId', (request: Request, response: Response) => {
            let testresults: ITestergebnisModel[] = [];

            DashboardRoute.hasUserAccessToDashboard(request.params.userId, request.header('request-token'),
            request.params.quizId)
            .then(function(hasAccess){
                return request.params.quizId;
            })
            .then(MongoDBConnector.getAllTestresultsOfTest)
            .then(function(value){
                testresults = value;
                return request.params.courseId;
            })
            .then(MongoDBConnector.getAllStudentsOfCourse)
            .then(function(students){
                DashboardRoute.sendSuccessResponse(DashboardRoute.assembleQuizUserResult(students, testresults), response);
            }, function(err){
                DashboardRoute.sendFailureResponse("Fehler beim Laden der Testergebnisse", err, response);
            });
        });
    }

    private static assembleQuizUserResult(students: IUserModel[], testresults: ITestergebnisModel[]): QuizUserResult[]{
        let result: QuizUserResult[] = [];

        for(let i = 0; i < students.length; i++){
            let tmp = new QuizUserResult(students[i]._id, "Nicht teilgenommen");
            for(let t = 0; t < testresults.length; t++){
                if(testresults[t].ZugehörigerUser === students[i]._id){
                    tmp.points = testresults[t].ErreichtePunkte  + (testresults[t].ErreichtePunkte> 1?" Punkte":" Punkt");
                }
            }
            result.push(tmp);
        }

        result.sort(function(a, b) {
            return a.user_id.localeCompare(b.user_id);
        });
        return result;
    }

    private static hasUserAccessToDashboard(userId: string, token: string, quizId: string): Promise<boolean> {
        const deferred = require('q').defer();

        DashboardRoute.isTokenValid(userId, token)
        .then(function(isTokenValid){
            return userId;
        })
        .then(DashboardRoute.isUserAdmin)
        .then(function(isAdmin){
            return userId;
        })
        .then(MongoDBConnector.getUserById)
        .then(function(user){
            return (user.Kurse.indexOf(quizId.substring(0, quizId.indexOf("_"))) > -1 ) ? deferred.resolve(true) :
                deferred.reject("Der Nutzer ist nicht in den zu diesem Test zugehörigen Kurs eingeschrieben"+
                 " und daher nicht zur Ansicht der Testergebnisse berechtigt.");
        }, function(err){
            deferred.reject(err);
        });

        return deferred.promise;
    }

}
