import { Request, Response } from "express";
import { Route } from "../../interfaces/Route";
import { UserLevel } from "../../interfaces/Results";
import { MongoDBConnector } from "../../DBConnectors/MongoDBConnector";

export class UserRoute extends Route {

    public getRoutes(): void {
        this.app.get('/user/', (request: Request, response: Response) => {
            UserRoute.sendSuccessResponse("Hello User!", response);
        });

        // liefert eine Liste von Studenten, die noch keinen Kurs haben
        //TODO prüfen, ob der user mit der angegebenen Id die Berechtigung dazu hat
        this.app.get('/users/:userId/available', (request: Request, response: Response) => {
            MongoDBConnector.getAllAvailableUsers()
                .then(function(user){
                    let result: string[] = [];

                    for(let i = 0; i < user.length; i++){
                        if(user[i].UserTyp === UserLevel.STUDENT)
                            result.push(user[i]._id);
                    }

                    UserRoute.sendSuccessResponse(result, response);
                }, function(err){
                    UserRoute.sendFailureResponse("Fehler beim Ermitteln der verfügbaren Nutzer", err, response);
                });
        });
    }

}
