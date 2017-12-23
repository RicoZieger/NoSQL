import { Express, Request, Response } from "express";
import { LoginResult, Message, Status, UserLevel } from "../../interfaces/Results";
import { MariaDBConnector } from "../../DBConnectors/MariaDBConnector";
import { MongoDBConnector } from "../../DBConnectors/MongoDBConnector";
import { IUserModel } from "../../models/User";
import mysql = require('mysql');

export class LoginRoute {

    public static getRoutes(app: Express): void {
        app.post('/login', (request: Request, response: Response) => {
            response.setHeader('Content-Type', 'application/json');

            MariaDBConnector.getUserId(request.body.username, request.body.password)
              .then(MongoDBConnector.getUserByExternalId)
              .then(function(user){
                  LoginRoute.sendSuccessResponse(user.Id, user.UserTyp, response);
              }, function(err){
                  LoginRoute.sendFailureResponse("Login fehlgeschlagen", err, response);
              });
        });
    }

    private static sendFailureResponse(failureMessage: string, error: Error, response: Response): void {
        console.log(error);
        response.send(JSON.stringify(
            {
                status: Status.FAILURE,
                data: {
                    message: failureMessage
                }
            }
        ));
    }

    private static sendSuccessResponse(id: number, userLevel: UserLevel, response: Response): void {
        const message: Message = {
            status: Status.SUCCESS,
            data: new LoginResult(id, userLevel)
        };
        response.send(JSON.stringify(message));
    }
}
