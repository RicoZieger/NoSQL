import { Express, Request, Response } from "express";
import { Route } from "../../interfaces/Route";

export class LoginRoute implements Route {

    private app: Express;

    constructor(expressApp: Express) {
        this.app = expressApp;
    }

    public getRoutes(): void {
        this.app.post('/login', (request: Request, response: Response) => {
            response.setHeader('Content-Type', 'application/json');
            response.send('{ "message" : "Hello Login!" }');
        });
    }


}