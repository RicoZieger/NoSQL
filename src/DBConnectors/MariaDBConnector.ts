import mysql = require('mysql');

export class MariaDBConnector {

    static url: string = process.env.MY_SQL;
    private connection: mysql.Connection;

    constructor() {
        // Open the MariaDB connection.
        this.connection = mysql.createConnection(MariaDBConnector.url);
    }

    // Close the existing connection.
    public closeDbConnection() {
        if (this.connection) {
            this.connection.end();
            this.connection = null;
        }
    }

    public getUserId(Id: string, passwort: string, callback: (userId: number, error?: mysql.MysqlError) => void) {
        const query = 'SELECT Id FROM User WHERE User.Id = ? AND User.passwort = ? LIMIT 1;';
        return this.connection.query(query, [Id, passwort], (error, results, fields) => {
            if (error || results.length === 0) {
                callback(null, error);
            } else {
                callback(results[0].Id);
            }
        });
    }

}
