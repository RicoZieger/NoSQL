import { Request, Response } from "express";
import { Route } from "../../interfaces/Route";
import { LoginResult, Message, Status, UserLevel } from "../../interfaces/Results";
import { MariaDBConnector } from "../../DBConnectors/MariaDBConnector";
import { MongoDBConnector } from "../../DBConnectors/MongoDBConnector";
import mysql = require('mysql');

export class LoginRoute extends Route {

    public getRoutes(): void {
        this.app.post('/login', (request: Request, response: Response) => {
            response.setHeader('Content-Type', 'application/json');

            const mariaDBConnector = new MariaDBConnector();
            const mongoDbConnection = new MongoDBConnector();

            mariaDBConnector.getUserId(request.body.username, request.body.password, (mariaDbUserId: number, error?: mysql.MysqlError) => {
                if (mariaDbUserId == null || error) {
                    LoginRoute.sendFailureResponse("Login fehlgeschlagen - User existiert nicht in MariaDB", response);
                } else {
                    mongoDbConnection.openDbConnection()
                        .then(() => {
                            this.getUserDataFromMongoDb(mongoDbConnection, mariaDbUserId, response);
                        }, () => {
                            LoginRoute.sendFailureResponse("Login fehlgeschlagen - Verbindungsfehler zur MongoDB.", response);
                        });
                }
            });
        });
    }

    private getUserDataFromMongoDb(mongoDbConnection: MongoDBConnector, mariaDbUserId, response: Response) {
        mongoDbConnection.getUserByExternalId(mariaDbUserId)
            .then((mongoDbUser: any) => {
                mongoDbConnection.closeDbConnection();

                const mongoUserId = mongoDbUser.Id as number;
                const mongoUserTyp = mongoDbUser.UserTyp as UserLevel;
                LoginRoute.sendSuccessResponse(mongoUserId, mongoUserTyp, response);
            }, () => {
                LoginRoute.sendFailureResponse("Login fehlgeschlagen - Konnte MariaDB User nicht zu MongoDB User zuordnen.", response);
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
