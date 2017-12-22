import { Express } from "express";

export abstract class Route {
    protected app: Express;

    constructor(expressApp: Express) {
        this.app = expressApp;
    }

    abstract getRoutes(): void;
}