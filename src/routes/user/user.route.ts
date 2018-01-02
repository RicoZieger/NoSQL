import { Request, Response } from "express";
import { Route } from "../../interfaces/Route";
import { UserLevel, Status } from "../../interfaces/Results";
import { MongoDBConnector } from "../../DBConnectors/MongoDBConnector";
import { MariaDBConnector } from "../../DBConnectors/MariaDBConnector";
import { IUserModel, MongoUser } from "../../models/User";

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

        //legt einen neuen Nutzer an.
        //NOTE Es wird nicht geprüft, ob bereits ein Nutzer mit dieser Id existiert.
        this.app.post('/users/register/', (request: Request, response: Response) => {
            const id: string = request.body.id;
            const password: string = request.body.password;
            const level:string = request.body.level;

            MariaDBConnector.createUser(id, password)
            .then(function (val){
                return new MongoUser({_id: id, UserTyp: level, Kurse: null, Testergebnisse: null}).save();
            })
            .then(function(result){
                UserRoute.sendSuccessResponse("Registrierung erfolgreich", response);
            }, function(err){
                UserRoute.sendFailureResponse("Registrierung fehlgeschlagen", err, response);
            });
        });
    }

}
