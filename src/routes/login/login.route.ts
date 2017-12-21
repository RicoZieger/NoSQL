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
            var mongoDbConnection = new MongoDBConnector();

            mariaDbConnection.openDbConnection().then(function(value){
              console.log("username: "+request.body.username);
              console.log("passwort: "+request.body.password);
                  mariaDbConnection.getUserId(request.body.username, request.body.password).then(function (mariaDbUserId) {
                  mariaDbConnection.closeDbConnection();
                  console.log("Login in MariaDB erfolgreich.");

                  mongoDbConnection.openDbConnection().then(function(value){
                      mongoDbConnection.getUserByExternalId(mariaDbUserId).then(function(mongoDbUser){
                          mongoDbConnection.closeDbConnection();
                          console.log("Login in MongoDB erfolgreich.");

                          var mongoUserId: int = mongoDbUser.Id;
                          var mongoUserTyp: UserLevel = (mongoDbUser.UserTyp === "Student" ? UserLevel.STUDENT : UserLevel.PROFESSOR);
                          LoginRoute.sendSuccessResponse(mongoUserId, mongoUserTyp, response);
                      }, function(error){
                          LoginRoute.sendFailureResponse("Login fehlgeschlagen - Konnte MariaDB User nicht zu MongoDB User zuordnen.", response);
                      });
                  }, function(error){
                      LoginRoute.sendFailureResponse("Login fehlgeschlagen - Verbindungsfehler zur MongoDB.", response);
                  });
              },function(error){
                 LoginRoute.sendFailureResponse("Login fehlgeschlagen - User existiert nicht in MariaDB", response);
              });
            },function(err){
              LoginRoute.sendFailureResponse("Login fehlgeschlagen - Verbindungsfehler zur MariaDB", response);
            });
        });
    }

    static sendFailureResponse(failureMessage: string, response: Response):void {
        console.log(failureMessage);
        response.send(JSON.stringify(
          {
              status: 'FAILURE',
              data: {
                  message: failureMessage
              }
          }
      ));
    }

    static sendSuccessResponse(id: int, userLevel: UserLevel, response: Response): void{
      const message: Message = {
          status: Status.SUCCESS,
          data: LoginResult
      };
      message.data = new LoginResult(id, userLevel);
      response.send(JSON.stringify(message));
    }
}
