import * as express from "express";
import { Request, Response } from "express";
import * as bodyParser from "body-parser";
import { UserRoute } from "./routes/user/user.route";
import { LoginRoute } from "./routes/login/login.route";
import { CourseRoute } from "./routes/course/course.route";
import { DocumentRoute } from "./routes/documents/documents.route";
import { DashboardRoute } from "./routes/dashboard/dashboard.route";
import { QuizRoute } from "./routes/quiz/quiz.route";
import { MongoDBConnector } from "./DBConnectors/MongoDBConnector";
import { MariaDBConnector } from "./DBConnectors/MariaDBConnector";
import cors = require('cors');

console.log('MongoDB', process.env.MONGO_DB);
console.log('MySQL', process.env.MY_SQL);

const app = express();
app.use(bodyParser.json({limit: '100mb'}));
app.use(bodyParser.urlencoded({limit: '100mb', extended: true}));
app.use(function (req, res, next) {
    next();
});

//enable cors and pre-flight check
app.use(cors());
app.options('*', cors());

app.get('/', (request: Request, response: Response) => {
    response.setHeader('Content-Type', 'application/json');
    response.send('{ "message" : "Hello World!" }');
});

MariaDBConnector.setup();
MongoDBConnector.setup();


new LoginRoute(app).getRoutes();
new UserRoute(app).getRoutes();
new CourseRoute(app).getRoutes();
new QuizRoute(app).getRoutes();
new DocumentRoute(app).getRoutes();
new DashboardRoute(app).getRoutes();

app.listen(3000, () => {
    console.log('Listening on port 3000');
});
