import { Express, Response } from "express";
import { Message, Status } from "../interfaces/Results";

export abstract class Route {
    protected app: Express;

    constructor(expressApp: Express) {
        this.app = expressApp;
    }

    abstract getRoutes(): void;

    protected static sendFailureResponse(failureMessage: string, error: Error, response: Response): void {
        response.setHeader('Content-Type', 'application/json');

        console.log(error);
        response.end(JSON.stringify(
            {
                status: Status.FAILURE,
                data: {
                    message: failureMessage
                }
            }
        ));
    }

    protected static sendSuccessResponse(messageData: any, response: Response): void {
        response.setHeader('Content-Type', 'application/json');
        
        const message: Message = {
            status: Status.SUCCESS,
            data: messageData
        };
        response.end(JSON.stringify(message));
    }
}
