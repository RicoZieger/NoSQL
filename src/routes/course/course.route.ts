import { Route } from "../../interfaces/Route";
import { Express, Request, Response } from "express";
import { CourseResult, Message, Status, Topic } from "../../interfaces/Results";

export class CourseRoute implements Route {
    private app: Express;

    constructor(expressApp: Express) {
        this.app = expressApp;
    }

    getRoutes(): void {
        this.app.get('/user/:userId/course/:courseId', (request: Request, response: Response) => {
            response.setHeader('Content-Type', 'application/json');

            const userId = request.params.userId;
            const courseId = request.params.courseId;

            // TODO load real course from database

            const courseResult = new CourseResult(123, 'Mock Kurs');
            courseResult.topics = [
                new Topic(111, 'Thema 1', 'Das erste Thema'),
                new Topic(222, 'Thema 2', 'Das zweite Thema'),
                new Topic(333, 'Thema 3', 'Das dritte Thema')
            ];

            const message: Message = {
                status: Status.SUCCESS,
                data: courseResult
            };

            response.send(JSON.stringify(message));
        });
    }

}