import express, { Express } from "express";
import { Server } from "http";
import ejs, { Data } from 'ejs';
import path from "path";
import fs from "fs";

export class WebServer {
    private app: Express;
    private server: Server;

    public constructor (port: number, staticPath: string, renderData?: Data) {
        const isDir = fs.statSync(staticPath).isDirectory();
        this.app = express();

        const indexFile = isDir ? (fs.existsSync(path.join(staticPath, "index.ejs")) && renderData ?
            path.join(staticPath, "index.ejs") :
            path.join(staticPath, "index.html")) : staticPath;

        this.app.get("/", renderData ? (req, res) => {
            ejs.renderFile(indexFile, renderData, (err, str) => {
                if (err)
                    throw err;
                res.send(str);
            });
        } : (req, res) => {
            res.sendFile(path.resolve(indexFile));
        });

        this.app.use(
            express.static(isDir ? staticPath : path.dirname(staticPath)),
        );

        this.server = this.app.listen(port);
    }

    public stop(): void {
        this.server.close();
    }
}