import { MariaDBConnector } from './../../DBConnectors/MariaDBConnector';
import { Request, Response } from "express";
import { Route } from "../../interfaces/Route";
import { MongoDBConnector } from '../../DBConnectors/MongoDBConnector';

export class UserRoute extends Route {

    public getRoutes(): void {

        this.app.get('/user/', (request: Request, response: Response) => {
            response.setHeader('Content-Type', 'application/json');
            response.send(JSON.stringify(
                {
                    message: 'Hello User!'
                }
            ));
        });

        this.app.post('/user/register/', (request: Request, response: Response) => {
            var id = request.body.id;
            var password = request.body.password;
            MariaDBConnector.createUser(id, password)
            .then(MongoDBConnector.saveUser)    
            .then(function(result){
                UserRoute.sendSuccessResponse(result, response);
            }, function(err){
                UserRoute.sendFailureResponse("Login fehlgeschlagen", err, response);
            });

        });
    }

}