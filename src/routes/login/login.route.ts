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

            if (request.body.username != null && request.body.password != null) {
                response.send(JSON.stringify(
                    {
                        status: 'SUCCESS',
                        data: {
                            userId: 1234567,
                            level: 'STUDENT'
                        }
                    }
                ));
            } else {
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
    }


}