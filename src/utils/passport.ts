import { Status } from './../interfaces/Results';
import { IUserModel, MongoUser } from './../models/User';
import { MariaDBConnector } from './../DBConnectors/MariaDBConnector';
import { LocalStrategy } from "passport-local";

export function myAuthenticate(passport: any) {
        passport.use(new LocalStrategy((username, password, done) => {
        MariaDBConnector.getUserById(username).then((mysqlUser) => {
            if (!mysqlUser) {
                return done(null, false, {message: Status.FAILURE});
            }
            if(password === mysqlUser.passwort) {
                MongoUser.findOne({id: mysqlUser.Id}, (err, mongoUser) => {
                    return done(null, mongoUser);
                })
            } else {
                    return done(null, false, {message: Status.FAILURE});
                }
            });

        }));

    passport.serializeUser((user, done) => {
        done(null, user.Id);
    });

    passport.deserializeUser((id, done) => {
        MongoUser.findById(id, (err, mongoUser)=>{
            done(err, mongoUser);
        });
    });
}