import { Request, Response } from "express";
import { Route } from "../../interfaces/Route";

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
    }

}