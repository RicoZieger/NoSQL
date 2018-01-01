import { Request, Response } from "express";
import { Route } from "../../interfaces/Route";
import { MongoDBConnector } from "../../DBConnectors/MongoDBConnector";
import { QuizUserResult } from "../../interfaces/Results";
import { IUserModel } from "../../models/User";
import { ITestergebnisModel } from "../../models/Testergebnis";

export class DashboardRoute extends Route {

    public getRoutes(): void {
        //returns the test results for all students in the given course/quiz)
        //TODO prüfen ob der angegebene Nutzer die Berechtigung hat
        this.app.get('/dashboards/users/:userId/courses/:courseId/quizs/:quizId', (request: Request, response: Response) => {
            let testresults: ITestergebnisModel[] = [];

            MongoDBConnector.getAllTestresultsOfTest(request.params.quizId)
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
                    tmp.points = testresults[t].ErreichtePunkte+" Punkte";
                }
            }
            result.push(tmp);
        }

        return result;
    }

}
