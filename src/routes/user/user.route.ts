import { Request, Response } from "express";
import { Route } from "../../interfaces/Route";
import { UserLevel, Status } from "../../interfaces/Results";
import { MongoDBConnector } from "../../DBConnectors/MongoDBConnector";
import { MariaDBConnector } from "../../DBConnectors/MariaDBConnector";

export class UserRoute extends Route {

    public getRoutes(): void {
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

        this.app.post('/users/register/', (request: Request, response: Response) => {
            var id = request.body.id;
            var password = request.body.password;
            var level = request.body.level;
            MariaDBConnector.createUser(id, password)
            .then(MongoDBConnector.saveUser(id, level))    
            .then(function(result){
                UserRoute.sendSuccessResponse(result, response);
            }, function(err){
                UserRoute.sendFailureResponse("Registrierung fehlgeschlagen", err, response);
            });

        });
    }

}
