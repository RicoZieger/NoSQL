import { Request, Response } from "express";
import { Route } from "../../interfaces/Route";
import { UserLevel, Status } from "../../interfaces/Results";
import { MongoDBConnector } from "../../DBConnectors/MongoDBConnector";
import { MariaDBConnector } from "../../DBConnectors/MariaDBConnector";
import { MongoUser } from "../../models/User";

export class UserRoute extends Route {

    public getRoutes(): void {
        // liefert eine Liste von Studenten, die noch keinen Kurs haben
        //NOTE Nur Admins haben Zugriff auf diese Route
        this.app.get('/users/:userId/available', (request: Request, response: Response) => {
            UserRoute.hasUserAccessToStudentsList(request.params.userId, request.header('request-token'))
            .then(MongoDBConnector.getAllAvailableUsers)
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
        //TODO Wird das wieder entfernt? Ansonsten muss noch ne Prüfung rein
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


    private static hasUserAccessToStudentsList(userId: string, token: string): Promise<boolean> {
        return UserRoute.isTokenValid(userId, token)
        .then(function(isValid){
            return userId;
        })
        .then(UserRoute.isUserAdmin);
    }

}
