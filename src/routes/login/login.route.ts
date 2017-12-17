import { Express, Request, Response } from "express";
import { Route } from "../../interfaces/Route";
import { LoginResult, Message, Status, UserLevel } from "../../interfaces/Results";

export class LoginRoute implements Route {

    private app: Express;

    constructor(expressApp: Express) {
        this.app = expressApp;
    }

    public getRoutes(): void {
        this.app.post('/login', (request: Request, response: Response) => {
            response.setHeader('Content-Type', 'application/json');

            if (request.body.username != null && request.body.password != null) {
                const message: Message = {
                    status: Status.SUCCESS,
                    data: LoginResult
                };
                // TODO load real data from database
                message.data = new LoginResult(1234567, UserLevel.STUDENT);

                response.send(JSON.stringify(message));
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