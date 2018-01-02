import { Request, Response } from "express";
import { Route } from "../../interfaces/Route";
import { LoginResult } from "../../interfaces/Results";
import { MariaDBConnector } from "../../DBConnectors/MariaDBConnector";
import { MongoDBConnector } from "../../DBConnectors/MongoDBConnector";
import { IUserModel } from "../../models/User";
import { ITokenModel, MongoToken } from "../../models/Token";
import { Md5 } from 'ts-md5/dist/md5';

export class LoginRoute extends Route{

    getRoutes(): void {
        this.app.post('/login', (request: Request, response: Response) => {
            let user: IUserModel;

            MariaDBConnector.getUserId(request.body.username, request.body.password)
              .then(MongoDBConnector.getUserById)
              .then(function(userModel){
                  user = userModel
                  return userModel;
              })
              .then(LoginRoute.updateUserToken)
              .then(function(tokenModel){
                  LoginRoute.sendSuccessResponse(LoginRoute.assembleLoginResult(user, tokenModel), response);
              }, function(err){
                  LoginRoute.sendFailureResponse("Login fehlgeschlagen", err, response);
              });
        });
    }

    private static assembleLoginResult(user: IUserModel, token: ITokenModel): LoginResult{
        return new LoginResult(user._id, user.UserTyp, token.secret);
    }

    private static updateUserToken(user: IUserModel): Promise<ITokenModel> {
        const newToken = LoginRoute.generateToken();
        const options = { new: true };
        const deferred = require('q').defer();

        MongoToken.findOneAndUpdate({_id: user._id}, {secret: newToken}, options, function(err, result) {
              if (!err) {
                  if (!result) {
                      result = new MongoToken({_id:user._id, secret: newToken});
                  }
                  return deferred.resolve(result.save());
              }else{
                  return deferred.reject();
              }
          });

        return deferred.promise;
    }

    private static generateToken(): string{
        return Md5.hashStr(new Date().getMilliseconds()+'MartinaIstVollToll:)'+(Math.floor(Math.random() * 10) + 1)).toString();
    }
}
