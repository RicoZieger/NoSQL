import { Route } from "../../interfaces/Route";
import { Request, Response } from "express";
import { Message, Question, QuizResult, Status } from "../../interfaces/Results";
import { MongoDBConnector } from "../../DBConnectors/MongoDBConnector";
import { ITestModel, mongoTest} from "../../models/Test";
import { IFrageModel, mongoFrage} from "../../models/Frage";

export class QuizRoute extends Route {

    private static test: ITestModel;
    private static questions: IFrageModel[];

    getRoutes(): void {
        this.app.get('/user/:userId/course/:courseId/quiz/:quizId', (request: Request, response: Response) => {
            response.setHeader('Content-Type', 'application/json');

            //TODO userId und courseId können entfallen, da ein Test über seine Id eindeutig aufgefunden werden kann.
            //(beide Werte werden hier auch nicht verwendet)
            const userId = request.params.userId;
            const courseId = request.params.courseId;
            const quizId = request.params.quizId;

            MongoDBConnector.getTestById(quizId)
                .then(QuizRoute.getAllQuestions)
                .then(function(questions){
                    QuizRoute.questions = questions;
                    let quizResult: QuizResult = QuizRoute.assembleQuizResult();
                    QuizRoute.sendSuccessResponse(quizResult, response);
                },function(err){
                    QuizRoute.sendFailureResponse("Fehler beim Laden des Tests", err, response);
                });
        });
    }

    private static getAllQuestions(question: ITestModel): Promise<IFrageModel[]> {
        return MongoDBConnector.getQuestionsByIds(question.Fragen);
    }

    private static assembleQuizResult(): QuizResult{
        let questions: Question[] = new Array();

        for(var i = 0; i < QuizRoute.questions.length; i++){
            questions.push(new Question(QuizRoute.questions[i]._id, QuizRoute.questions[i].Fragetext,
                QuizRoute.questions[i].Antworten));
        }

        return new QuizResult(QuizRoute.test._id, QuizRoute.test.Titel, questions);
    }

}
