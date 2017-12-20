var mysql = require('mysql');
var Q = require("q");

export class MariaDBConnector{

  static url: string = process.env.MY_SQL;
  connection:any = null;  

  // Open the MongoDB connection.
  public openDbConnection() {
      this.connection = mysql.createConnection(MariaDBConnector.url);
      this.connection.connect(function(err) {
        if (err) {
          return;
        }
      });
   }

  // Close the existing connection.
  public closeDbConnection() {
      if (this.connection) {
        this.connection.end(function(err) {});
        this.connection = null;
      }
  }

  public getUserId(Id: string, passwort: string): int{
    var deferred = Q.defer();

    this.connection.query('SELECT Id FROM `User` WHERE `Id` = \"'+Id+'\" AND passwort = SHA1(\"'+passwort+'\");', function (error, results, fields) {
      if(error || results.length === 0){
        return deferred.reject();
      }else{
        return deferred.resolve(results[0].Id);
      }
    });

    return deferred.promise;
  }

}
