import { Route } from "../../interfaces/Route";
import { Request, Response } from "express";
import { Message, FileMetadata } from "../../interfaces/Results";
import { MongoDBConnector } from "../../DBConnectors/MongoDBConnector";
import { IDateiModel, mongoDatei} from "../../models/Datei";
import mime = require('mime-types');
import filesystem = require('fs');


export class DocumentRoute extends Route {

    getRoutes(): void {
        this.app.get('/file/:fileId', (request: Request, response: Response) => {

            //TODO Dateiname aus Metadaten einlesen
            let mimetype = mime.lookup("TestDatei.txt");
            response.setHeader('Content-type', mimetype);

            const fileId = request.params.fileId;
            const fileStream = MongoDBConnector.getFileById(fileId);
            const tmpFileName = 'tmp_down_'+fileId;
            let fileBuffer = "";

            fileStream.on('error', function (err) {
                DocumentRoute.sendFailureResponse("Datei konnte nicht heruntergeladen werden", err, response);
            });

            fileStream.on('data', function(data){
                fileBuffer += JSON.parse(JSON.stringify(data)).data;
            });

            fileStream.on('end', function(value){
                filesystem.writeFile(tmpFileName, Buffer.from(fileBuffer), function(err){
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
            response.setHeader('Content-Type', 'application/json');

            const upload = request.body;
            const filename = request.params.filename;
            const tmpFileName = "tmp_up_"+filename;
            let fileBuffer = "";

            request.on('data', function(data){
                fileBuffer += JSON.parse(JSON.stringify(data)).data;
            });

            request.on('end', function(value){
                filesystem.writeFile(tmpFileName, Buffer.from(fileBuffer), function(err){
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
