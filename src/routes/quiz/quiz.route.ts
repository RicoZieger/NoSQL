import { Route } from "../../interfaces/Route";
import { Express, Request, Response } from "express";
import { Message, Question, QuizeResult, Status } from "../../interfaces/Results";

export class QuizRoute implements Route {
    private app: Express;

    constructor(expressApp: Express) {
        this.app = expressApp;
    }

    getRoutes(): void {
        this.app.get('/user/:userId/course/:courseId/quiz/:quizId', (request: Request, response: Response) => {
            response.setHeader('Content-Type', 'application/json');

            const userId = request.params.userId;
            const courseId = request.params.courseId;
            const quizId = request.params.quizId;

            // TODO load real quiz from database

            const quizeResult = new QuizeResult(456, 'Mock Quiz', [
                new Question(1, 'Was ist dir richtige Antwort?', ['a', 'b', 'c']),
                new Question(2, 'Was ist dir richtigere Antwort?', ['a', 'b', 'c', 'd']),
                new Question(2, 'Was ist dir richtigste Antwort?', ['a', 'b', 'c', 'd', 'e'])
            ]);

            const message: Message = {
                status: Status.SUCCESS,
                data: quizeResult
            };

            response.send(JSON.stringify(message));
        });
    }

}