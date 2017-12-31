import { Express, Request, Response } from "express";
import { Route } from "../../interfaces/Route";
import { LoginResult, Message, Status, UserLevel } from "../../interfaces/Results";
import { MariaDBConnector } from "../../DBConnectors/MariaDBConnector";
import { MongoDBConnector } from "../../DBConnectors/MongoDBConnector";
import { IUserModel } from "../../models/User";
import mysql = require('mysql');
import * as passport from "passport";
import { myAuthenticate } from "../../utils/passport";

export class LoginRoute extends Route{

    getRoutes(): void {
    this.app.post('/login', (request: Request, response: Response) => {
    response.setHeader('Content-Type', 'application/json');

    passport.authenticate('local', {
        successRedirect: "http://localhost:4200/course",
        failureRedirect: "http://localhost:4200/login",
        failureFlash: "Wrong username or password"
    });
    /*
    .then(MongoDBConnector.getUserByExternalId(request.username))
    .then(function(user){
          LoginRoute.sendSuccessResponse(LoginRoute.assembleLoginResult(user), response);
      }, function(err){
          LoginRoute.sendFailureResponse("Login fehlgeschlagen", err, response);
      });;
      */
});
}

    private static assembleLoginResult(user: IUserModel): LoginResult{
        return new LoginResult(user.Id, user.UserTyp);
    }
}
