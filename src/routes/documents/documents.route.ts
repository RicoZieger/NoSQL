import { Route } from "../../interfaces/Route";
import { Request, Response } from "express";
import { MongoDBConnector } from "../../DBConnectors/MongoDBConnector";
import mime = require('mime-types');
import filesystem = require('fs');


/*
    NOTE
    This class exists only for test purposes and might not be consistent when it comes to coding and/or naming
    conventions.
*/
export class DocumentRoute extends Route {

    getRoutes(): void {
        //NOTE Nur Studenten, die in dem zu den Dateien zugehörigen Kurs eingeschrieben sind, sind berechtigt
        this.app.get('users/:userId/courses/:courseId/files/:fileId', (request: Request, response: Response) => {

            DocumentRoute.isTokenValid(request.params.userId, request.header('request-token'))
            .then(function(isValid){
                return request.params.userId;
            })
            .then(DocumentRoute.isUserStudent)
            .then(function(isStudent){
                return request.params.fileId;
            })
            .then(MongoDBConnector.getFileMetadataById)
            .then(function(file){
                const fileStream = MongoDBConnector.getFileById(file.gridfsLink);
                const tmpFileName = 'tmp_down_'+file.gridfsLink;
                let mimetype = mime.lookup(file.Titel);
                let data = [];
                response.setHeader('Content-type', mimetype);

                fileStream.on('error', function (err) {
                    DocumentRoute.sendFailureResponse("Datei konnte nicht heruntergeladen werden", err, response);
                });

                fileStream.on('data', function(chunk){
                    data.push(chunk);
                });

                fileStream.on('end', function(){
                    filesystem.writeFile(tmpFileName, Buffer.concat(data), function(err){
                        if(err){
                            DocumentRoute.sendFailureResponse("Datei konnte zur Weiterverarbeitung nicht zwischengespeichert werden", err, response);
                        }else{
                            response.download(tmpFileName, "Dateiname_aus_Metadaten.pdf", function(err){
                                if(err){
                                    DocumentRoute.sendFailureResponse("Fehler beim Herunterladen der Datei", err, response);
                                }
                                filesystem.unlinkSync(tmpFileName);
                            });
                        }
                    });
                });
            }, function(err){
                DocumentRoute.sendFailureResponse("Herunterladen der Datei fehlgeschlagen", err, response);
            });
        });

        this.app.post('/file/:filename', (request: Request, response: Response) => {
            const upload = request.body;
            const filename = request.params.filename;
            const tmpFileName = "tmp_up_"+filename;
            let data = [];

            request.on('data', function(chunk){
                data.push(chunk);
            });

            request.on('end', function(){
                filesystem.writeFile(tmpFileName, Buffer.concat(data), function(err){
                    if(err){
                        DocumentRoute.sendFailureResponse("Datei konnte zur Weiterverarbeitung nicht zwischengespeichert werden", err, response);
                    }else{
                        let fileStream = MongoDBConnector.saveFile(filename, tmpFileName);

                        fileStream.on('error', function (err) {
                            DocumentRoute.sendFailureResponse("Datei konnte nicht gespeichert werden", err, response);
                        });
                        fileStream.on('close', function (file) {
                            DocumentRoute.sendSuccessResponse("Datei wurde gespeichert unter der id: "+file._id, response);
                            filesystem.unlinkSync(tmpFileName);
                        });
                    }
                });
            });
        });
    }

}
