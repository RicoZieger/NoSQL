import { Express, Request, Response } from "express";
import { Route } from "../../interfaces/Route";
import { LoginResult, Message, Status, UserLevel } from "../../interfaces/Results";
import { MariaDBConnector } from "../../DBConnectors/MariaDBConnector";
import { MongoDBConnector } from "../../DBConnectors/MongoDBConnector";
import { IUserModel } from "../../models/User";
import mysql = require('mysql');

export class LoginRoute extends Route{

    getRoutes(): void {
        this.app.post('/login', (request: Request, response: Response) => {
            MariaDBConnector.getUserId(request.body.username, request.body.password)
              .then(MongoDBConnector.getUserByExternalId)
              .then(function(user){
                  LoginRoute.sendSuccessResponse(LoginRoute.assembleLoginResult(user), response);
              }, function(err){
                  LoginRoute.sendFailureResponse("Login fehlgeschlagen", err, response);
              });
        });
    }

    private static assembleLoginResult(user: IUserModel): LoginResult{
        return new LoginResult(user._id, user.UserTyp);
    }
}
