import { Express, Request, Response } from "express";
import { Route } from "../../interfaces/Route";
import { LoginResult, Message, Status, UserLevel } from "../../interfaces/Results";
import { MariaDBConnector } from "../../DBConnectors/MariaDBConnector";
import { MongoDBConnector } from "../../DBConnectors/MongoDBConnector";

export class LoginRoute implements Route {

    private app: Express;

    constructor(expressApp: Express) {
        this.app = expressApp;
    }

    public getRoutes(): void {
        this.app.post('/login', (request: Request, response: Response) => {
            response.setHeader('Content-Type', 'application/json');

            var mariaDbConnection = new MariaDBConnector();
            var mariaDbUserId;
            mariaDbConnection.openDbConnection();
            mariaDbConnection.getUserId(1, 'PasswortUser1').then(function (value) {
              mariaDbUserId = value;
              mariaDbConnection.closeDbConnection();
              console.log("MariaDB User success.");

              var mongoDbConnection = new MongoDBConnector();
              var mongoDbUser;
              mongoDbConnection.openDbConnection();
              mongoDbConnection.getUserByExternalId(mariaDbUserId).then(function(value){
                mongoDbUser = value;
                mongoDbConnection.closeDbConnection();

                console.log("mongodb user success");
                const message: Message = {
                    status: Status.SUCCESS,
                    data: LoginResult
                };
                message.data = new LoginResult(1234567, UserLevel.STUDENT);
                response.send(JSON.stringify(message));
              }, function(error){
                console.log("mongodb user fail");
                response.send(JSON.stringify(
                    {
                        status: 'FAILURE',
                        data: {
                            message: 'Interner Fehler - Konnte MariaDB User nicht zu MongoDB User zuordnen.'
                        }
                    }
                ));
              }),function(error){
                console.log("mariadb user fail");
                response.send(JSON.stringify(
                  {
                      status: 'FAILURE',
                      data: {
                          message: 'Login fehlgeschlagen'
                      }
                  }
              ));
              }
            });
        });
    }
}
