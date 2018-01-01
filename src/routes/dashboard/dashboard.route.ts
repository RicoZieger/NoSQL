import { Request, Response } from "express";
import { Route } from "../../interfaces/Route";
import { MongoDBConnector } from "../../DBConnectors/MongoDBConnector";

export class DashboardRoute extends Route {

    public getRoutes(): void {

        //returns the test results for all students in the given course/quiz)
        this.app.get('/dashboard/course/:courseId/quiz/:quizId', (request: Request, response: Response) => {
            MongoDBConnector.getAllTestresultsOfTest(request.params.quizId)
                .then(function(testresults){
                    MongoDBConnector.getAllStudentsOfCourse(request.params.courseId)
                        .then(function(students){
                            let result: JSON[] = [];

                            for(let i = 0; i < students.length; i++){
                                for(let t = 0; t < testresults.length; t++){
                                    if(testresults[t].ZugehörigerUser === students[i]._id){
                                        result.push(JSON.parse(JSON.stringify({student: students[i]._id, points: testresults[t].ErreichtePunkte})));
                                    }
                                }
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
