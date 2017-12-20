var mongo = require('mongodb').MongoClient;
var Q = require('q');

export class MongoDBConnector{

      static url: string = process.env.MONGO_DB;
      dbConnection: any = null;

      // Open the MongoDB connection.
      public openDbConnection() {
          if (this.dbConnection == null) {
              mongo.connect(MongoDBConnector.url, (err, db) => {
                  this.dbConnection = db.db("NoSQL_Moodle");
              });
          }
      }

      // Close the existing connection.
      public closeDbConnection() {
          if (this.dbConnection) {
              this.dbConnection.close();
              this.dbConnection = null;
          }
      }

      public getCourse(Id: string): any{
        var deferred = Q.defer();

        this.dbConnection.collection('Kurs').find({_id:Id}).toArray(function(err, documents){
		        this.dbConnection.close();
            return deferred.resolve(documents[0]);
	      });

        return deferred.promise;
      }

      public getTheme(Id: string): any{
        var deferred = Q.defer();

        this.dbConnection.collection('Thema').find({_id:Id}).toArray(function(err, documents){
		        this.dbConnection.close();
            return deferred.resolve(documents[0]);
	      });

        return deferred.promise;
      }

      public getFileMetadata(Id: string): any{
        var deferred = Q.defer();

        this.dbConnection.collection('Datei').find({_id:Id}).toArray(function(err, documents){
		        this.dbConnection.close();
            return deferred.resolve(documents[0]);
	      });

        return deferred.promise;
      }

      public getFileItself(Id: string): any{
        var deferred = Q.defer();
        var bucket = new mongo.GridFSBucket(db);
        var file;

        bucket.openDownloadStream(Id).
          pipe(file).
          on('error', function(error) {
            return deferred.reject();
          }).
          on('finish', function() {
            console.log('done!');
            return deferred.resolve(file);
          });

        return deferred.promise;
      }

      public getTest(Id: string): any{
        var deferred = Q.defer();

        this.dbConnection.collection('Test').find({_id:Id}).toArray(function(err, documents){
		        this.dbConnection.close();
            return deferred.resolve(documents[0]);
	      });

        return deferred.promise;
      }

      public getQuestion(Id: string): any{
        var deferred = Q.defer();

        this.dbConnection.collection('Frage').find({_id:Id}).toArray(function(err, documents){
		        this.dbConnection.close();
            return deferred.resolve(documents[0]);
	      });

        return deferred.promise;
      }

      public getTestresult(Id: string): any{
        var deferred = Q.defer();

        this.dbConnection.collection('Testergebnis').find({_id:Id}).toArray(function(err, documents){
		        this.dbConnection.close();
            return deferred.resolve(documents[0]);
	      });

        return deferred.promise;
      }

      public getUserByInternalId(Id: string): any{
        var deferred = Q.defer();

        this.dbConnection.collection('User').find({_id:Id}).toArray(function(err, documents){
          console.log("Error: "+err);
          console.log("Docs: "+documents);
		        this.dbConnection.close();
            return deferred.resolve(documents[0]);
	      });

        return deferred.promise;
      }

      public getUserByExternalId(Id: string): any{
        var deferred = Q.defer();

        this.dbConnection.collection('User').find({"Id":"1"}).toArray(function(err, documents){
          console.log("Error: "+err);
          console.log("Docs: "+documents);
		        this.dbConnection.close();
            return deferred.resolve(documents[0]);
	      });

        return deferred.promise;
      }
}
