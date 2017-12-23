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

            MariaDBConnector.getUserId(request.body.username, request.body.password, (mariaDbUserId: number, error?: mysql.MysqlError) => {
                if (mariaDbUserId == null || error) {
                    LoginRoute.sendFailureResponse("Login fehlgeschlagen - User existiert nicht in MariaDB", response);
                } else {
                    MongoDBConnector.getUserByExternalId(1, (user: IUserModel, error?: any) => {
                        if (user == null || error) {
                            LoginRoute.sendFailureResponse("Login fehlgeschlagen - User existiert nicht in MongoDB", response);
                        } else {
                            LoginRoute.sendSuccessResponse(user.Id, user.UserTyp, response);
                        }
                    });
                }
            });
        });
    }

    private static sendFailureResponse(failureMessage: string, response: Response): void {
        console.log(failureMessage);
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
