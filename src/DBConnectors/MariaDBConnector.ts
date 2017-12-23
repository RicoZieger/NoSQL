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

}
