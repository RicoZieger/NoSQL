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
        //TODO Nur Studenten den Download gestatten, die in dem zu den Dateien zugehörigen Kurs eingeschrieben sind
        this.app.get('/file/:fileId', (request: Request, response: Response) => {

            //TODO Dateiname aus Metadaten einlesen
            let mimetype = mime.lookup("TestDatei.pdf");
            response.setHeader('Content-type', mimetype);

            const fileId = request.params.fileId;
            const fileStream = MongoDBConnector.getFileById(fileId);
            const tmpFileName = 'tmp_down_'+fileId;
            let data = [];

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
