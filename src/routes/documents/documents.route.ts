import { Route } from "../../interfaces/Route";
import { Request, Response } from "express";
import { Message, FileMetadata } from "../../interfaces/Results";
import { MongoDBConnector } from "../../DBConnectors/MongoDBConnector";
import { IDateiModel, mongoDatei} from "../../models/Datei";
import mime = require('mime-types');


export class DocumentRoute extends Route {

    getRoutes(): void {
        this.app.get('/file/:fileId', (request: Request, response: Response) => {
            let mimetype = mime.lookup("TestDatei.txt");
            response.setHeader('Content-disposition', 'attachment; filename=' + "TestDatei.txt");
            response.setHeader('Content-type', mimetype);

            const fileId = request.params.fileId;
            const fileStream = MongoDBConnector.getFileById(fileId);

            fileStream.on('error', function (err) {
                DocumentRoute.sendFailureResponse("Datei konnte nicht heruntergeladen werden", err, response);
            });

            fileStream.pipe(response);
        });

        this.app.post('/file/:filename', (request: Request, response: Response) => {
            response.setHeader('Content-Type', 'application/json');

            const upload = request.body;
            const filename = request.params.filename;
            const tmpFileName = "tmpFile";

            let filesystem = require('fs');
            filesystem.writeFile(tmpFileName, upload, function(err){
                if(err){
                    DocumentRoute.sendFailureResponse("Datei konnte zur Weiterverarbeitung nicht zwischengespeichert werden", err, response);
                }else{
                    let fileStream = MongoDBConnector.saveFile(filename, tmpFileName);

                    fileStream.on('error', function (err) {
                        DocumentRoute.sendFailureResponse("Datei konnte nicht gespeichert werden", err, response);
                    });
                    fileStream.on('close', function (file) {
                        DocumentRoute.sendSuccessResponse("Datei wurde gespeichert unter der id: "+file._id, response);
                    });
                }
            });
        });
    }

}
