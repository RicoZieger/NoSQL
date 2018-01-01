import mysql =require('mysql');
import Q = require('q');
import { MysqlError, Pool, PoolConnection } from "mysql";

export class MariaDBConnector {
    private static pool: Pool;

    public static setup() {
        MariaDBConnector.pool = mysql.createPool(process.env.MY_SQL);
    }

    public static getUserId(Id: string, passwort: string): Q.Promise<{}> {
        const deferred = Q.defer();

        const query = 'SELECT Id FROM User WHERE User.Id = ? AND User.passwort = ? LIMIT 1;';
        MariaDBConnector.pool
            .getConnection((error: MysqlError, connection: PoolConnection) => {
                connection.query(query, [Id, passwort], (error, results, fields) => {
                    connection.release();
                    if (error || results.length === 0) {
                        return deferred.reject();
                    } else {
                        return deferred.resolve(results[0].Id);
                    }
                })
            });

        return deferred.promise;
    }

    public static getUserById(Id: string): Q.Promise<{}> {
        const deferred = Q.defer();

        const query = 'SELECT Id FROM User WHERE User.Id LIMIT 1;';
        MariaDBConnector.pool
            .getConnection((error: MysqlError, connection: PoolConnection) => {
                connection.query(query, [Id], (error, results, fields) => {
                    connection.release();
                    if (error || results.length === 0) {
                        return deferred.reject();
                    } else {
                        return deferred.resolve(results[0]);
                    }
                })
            });

        return deferred.promise;
    }

    public static createUser(Id: String, Password: String): Q.Promise<{}> {
        const deferred = Q.defer();
        const query = 'INSERT INTO User (id, passwort) VALUES (?, ?)';
        MariaDBConnector.pool.getConnection((error: MysqlError, connection: PoolConnection) => {
            connection.query(query,[Id, Password], (error, results) => {
                connection.release();
                if (error) {
                    console.log(error);
                    return deferred.reject();
                }else {
                    return  deferred.resolve(Id);
                }
            })
        });
        return deferred.promise;
    }

}
