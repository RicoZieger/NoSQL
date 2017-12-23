import mysql =require('mysql');
import { MysqlError, Pool, PoolConnection } from "mysql";

export class MariaDBConnector {
    private static pool: Pool;

    public static setup() {
        MariaDBConnector.pool = mysql.createPool(process.env.MY_SQL);
    }

    public static getUserId(Id: string, passwort: string, callback: (userId: number, error?: mysql.MysqlError) => void) {
        const query = 'SELECT Id FROM User WHERE User.Id = ? AND User.passwort = ? LIMIT 1;';
        return MariaDBConnector.pool
            .getConnection((error: MysqlError, connection: PoolConnection) => {
                connection.query(query, [Id, passwort], (error, results, fields) => {
                    if (error || results.length === 0) {
                        callback(null, error);
                    } else {
                        callback(results[0].Id);
                    }
                    connection.release();
                })
            });
    }

}
