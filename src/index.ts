import * as express from "express";
import { Request, Response } from "express";
import * as bodyParser from "body-parser";
import { UserRoute } from "./routes/user/user.route";
import { LoginRoute } from "./routes/login/login.route";
import { CourseRoute } from "./routes/course/course.route";

const app = express();
app.use(bodyParser.json()); // support JSON-encoded bodies
app.use(function (req, res, next) {

    // Website you wish to allow to connect
    res.setHeader('Access-Control-Allow-Origin', 'http://localhost:4200');

    // Request methods you wish to allow
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');

    // Request headers you wish to allow
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');

    // Set to true if you need the website to include cookies in the requests sent
    // to the API (e.g. in case you use sessions)
    res.setHeader('Access-Control-Allow-Credentials', true);

    // Pass to next layer of middleware
    next();
});

app.get('/', (request: Request, response: Response) => {
    response.setHeader('Content-Type', 'application/json');
    response.send('{ "message" : "Hello World!" }');
});

new LoginRoute(app).getRoutes();
new UserRoute(app).getRoutes();
new CourseRoute(app).getRoutes();


app.listen(3000, () => {
    console.log('Listening on port 3000');
});