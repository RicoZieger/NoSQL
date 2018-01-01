import { Request, Response } from "express";
import { Route } from "../../interfaces/Route";
import { MongoDBConnector } from "../../DBConnectors/MongoDBConnector";
import { QuizUserResult } from "../../interfaces/Results";

export class DashboardRoute extends Route {

    public getRoutes(): void {

        //returns the test results for all students in the given course/quiz)
        //TODO prüfen ob der angegebene Nutzer die Berechtigung hat
        this.app.get('/dashboards/users/:userId/courses/:courseId/quizs/:quizId', (request: Request, response: Response) => {
            MongoDBConnector.getAllTestresultsOfTest(request.params.quizId)
                .then(function(testresults){
                    MongoDBConnector.getAllStudentsOfCourse(request.params.courseId)
                        .then(function(students){
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

                            DashboardRoute.sendSuccessResponse(result, response);
                        }, function(err){
                            DashboardRoute.sendFailureResponse("Fehler beim Laden der Testergebnisse", err, response);
                        });
                }, function(err){
                    DashboardRoute.sendFailureResponse("Fehler beim Laden der Testergebnisse", err, response);
                });
        });
    }
}
