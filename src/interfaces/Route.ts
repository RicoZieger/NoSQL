import { Express, Response } from "express";
import { Message, Status, UserLevel } from "../interfaces/Results";
import { MongoToken } from "../models/Token";
import { MongoUser } from "../models/User";

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

    protected static isTokenValid(userId: string, token: string): Promise<boolean>{
        const deferred = require('q').defer();

        MongoToken.findOne({_id: userId}, function(err, res){
            if(err){
                return deferred.reject(err);
            }else{
                if(res === null){
                    return deferred.reject("Unbekannter Token-User");
                }
                return res.secret === token ? deferred.resolve(true) : deferred.reject("Token ungültig");
            }
        });

        return deferred.promise;
    }

    protected static isUserAdmin(userId: string): Promise<boolean> {
        return Route.isUserOfType(userId, UserLevel.PROFESSOR);
    }

    protected static isUserStudent(userId: string): Promise<boolean> {
        return Route.isUserOfType(userId, UserLevel.STUDENT);
    }

    private static isUserOfType(userId: string, type: UserLevel) : Promise<boolean> {
        const deferred = require('q').defer();

        MongoUser.findOne({_id: userId}, function(err, res){
            if(err){
                return deferred.reject(err);
            }else{
                if(res === null){
                    return deferred.reject("Nutzer "+userId+" existiert nicht");
                }
                return res.UserTyp === type ? deferred.resolve(true) :
                    deferred.reject("Keine Berechtigung");
            }
        });

        return deferred.promise;
    }
}
