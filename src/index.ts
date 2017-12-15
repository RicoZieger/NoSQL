import * as express from "express";
import { Request, Response } from "express";
import * as bodyParser from "body-parser";
import { UserRoute } from "./routes/user/user.route";
import { LoginRoute } from "./routes/login/login.route";

const app = express();
app.use(bodyParser.json()); // support JSON-encoded bodies

app.get('/', (request: Request, response: Response) => {
    response.setHeader('Content-Type', 'application/json');
    response.send('{ "message" : "Hello World!" }');
});

const loginRoute = new LoginRoute(app);
loginRoute.getRoutes();

const userRoute = new UserRoute(app);
userRoute.getRoutes();


app.listen(3000, () => {
    console.log('Listening on port 3000');
});