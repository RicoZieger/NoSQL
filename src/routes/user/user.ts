import { Express, Request, Response } from "express";
import { Route } from "../../interfaces/Route";

export class UserRoute implements Route {

    private app: Express;

    constructor(expressApp: Express) {
        this.app = expressApp;
    }

    public getRoutes(): void {
        this.app.get('/user/', (request: Request, response: Response) => {
            response.setHeader('Content-Type', 'application/json');
            response.send('{ "message" : "Hello User!" }');
        });
    }


}